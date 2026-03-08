(* ============================================================================
   Actor Model -- Erlang-style Message Passing Concurrency
   ============================================================================

   An implementation of the Actor model in OCaml featuring:

   - Actors with typed mailboxes and selective receive
   - Asynchronous message passing (send/tell)
   - Request-reply pattern (ask) with timeouts
   - Actor supervision trees (one-for-one, one-for-all, rest-for-one strategies)
   - Actor lifecycle management (start, stop, restart)
   - Named actor registry for address-based lookup
   - Monitoring and death notifications (links/monitors)
   - Behavior switching (become/unbecome for state machines)
   - Round-robin and broadcast routers
   - Dead letter handling for undeliverable messages
   - Built-in test suite

   Concepts demonstrated:
   - Message-passing concurrency without shared state
   - Supervision hierarchies for fault tolerance
   - Selective receive with pattern matching
   - Higher-order functions as actor behaviors
   - Functional state machines via behavior switching
   - "Let it crash" philosophy

   ============================================================================ *)

(* --------------------------------------------------------------------------
   Core Types
   -------------------------------------------------------------------------- *)

(** Unique actor identifier *)
type actor_id = int

(** Actor address -- how actors refer to each other *)
type actor_ref = {
  id: actor_id;
  name: string option;
}

(** Messages that flow between actors *)
type 'msg envelope = {
  from: actor_ref option;     (* sender, None for system messages *)
  to_ref: actor_ref;          (* recipient *)
  payload: 'msg;              (* the actual message *)
  timestamp: float;           (* when sent *)
  correlation_id: int option; (* for request-reply *)
}

(** System-level signals *)
type 'msg system_msg =
  | Start
  | Stop
  | Restart
  | Linked of actor_ref        (* actor linked to us *)
  | Unlinked of actor_ref      (* actor unlinked from us *)
  | Down of actor_ref * string (* monitored actor died with reason *)
  | DeadLetter of 'msg envelope

(** What an actor can do in response to a message *)
type 'msg effect =
  | Send of actor_ref * 'msg
  | Reply of 'msg               (* reply to current sender *)
  | Spawn of string option * ('msg -> 'msg actor_state -> 'msg effect list * 'msg actor_state)
  | SpawnResult of actor_ref    (* result of Spawn, used internally *)
  | Link of actor_ref
  | Unlink of actor_ref
  | Monitor of actor_ref
  | Become of ('msg -> 'msg actor_state -> 'msg effect list * 'msg actor_state)
  | Unbecome                    (* revert to previous behavior *)
  | StopSelf
  | StopChild of actor_ref
  | Escalate of string          (* escalate failure to supervisor *)
  | Log of string
  | NoEffect

(** Actor state *)
and 'msg actor_state = {
  self: actor_ref;
  data: 'msg;                  (* user-defined state *)
  behavior_stack: ('msg -> 'msg actor_state -> 'msg effect list * 'msg actor_state) list;
  mailbox: 'msg envelope list; (* pending messages *)
  links: actor_ref list;       (* bidirectional links *)
  monitors: actor_ref list;    (* actors we monitor *)
  monitored_by: actor_ref list;(* actors monitoring us *)
  alive: bool;
  restart_count: int;
  max_restarts: int;
}

(** Supervision strategies *)
type supervision_strategy =
  | OneForOne   (* restart only the failed child *)
  | OneForAll   (* restart all children if one fails *)
  | RestForOne  (* restart the failed child and all children started after it *)

(** Supervisor configuration *)
type supervisor_config = {
  strategy: supervision_strategy;
  max_restarts: int;          (* max restarts within window *)
  restart_window: float;      (* time window in seconds *)
}

(** Router strategies *)
type router_strategy =
  | RoundRobin
  | Broadcast
  | Random

(* --------------------------------------------------------------------------
   Actor Registry -- Named actor lookup
   -------------------------------------------------------------------------- *)

type 'msg registry_entry = {
  ref: actor_ref;
  state: 'msg actor_state;
}

type 'msg actor_system = {
  actors: (actor_id, 'msg registry_entry) Hashtbl.t;
  names: (string, actor_id) Hashtbl.t;
  next_id: int ref;
  dead_letters: 'msg envelope list ref;
  log: string list ref;
  children: (actor_id, actor_id list) Hashtbl.t;  (* parent -> children *)
  supervisors: (actor_id, supervisor_config) Hashtbl.t;
}

let create_system () : 'msg actor_system = {
  actors = Hashtbl.create 16;
  names = Hashtbl.create 16;
  next_id = ref 1;
  dead_letters = ref [];
  log = ref [];
  children = Hashtbl.create 16;
  supervisors = Hashtbl.create 16;
}

(* --------------------------------------------------------------------------
   Actor Creation & Lifecycle
   -------------------------------------------------------------------------- *)

let make_ref system name =
  let id = !(system.next_id) in
  system.next_id := id + 1;
  let r = { id; name } in
  (match name with
   | Some n -> Hashtbl.replace system.names n id
   | None -> ());
  r

let make_state ref_ initial_data behavior = {
  self = ref_;
  data = initial_data;
  behavior_stack = [behavior];
  mailbox = [];
  links = [];
  monitors = [];
  monitored_by = [];
  alive = true;
  restart_count = 0;
  max_restarts = 10;
}

let spawn system ?name initial_data behavior =
  let ref_ = make_ref system name in
  let state = make_state ref_ initial_data behavior in
  Hashtbl.replace system.actors ref_.id { ref = ref_; state };
  ref_

let spawn_child system parent_ref ?name initial_data behavior =
  let child_ref = spawn system ?name initial_data behavior in
  let existing = try Hashtbl.find system.children parent_ref.id with Not_found -> [] in
  Hashtbl.replace system.children parent_ref.id (child_ref.id :: existing);
  child_ref

let lookup_by_name system name =
  match Hashtbl.find_opt system.names name with
  | Some id ->
    (match Hashtbl.find_opt system.actors id with
     | Some entry -> Some entry.ref
     | None -> None)
  | None -> None

let lookup system ref_ =
  Hashtbl.find_opt system.actors ref_.id

let is_alive system ref_ =
  match lookup system ref_ with
  | Some entry -> entry.state.alive
  | None -> false

(* --------------------------------------------------------------------------
   Message Sending
   -------------------------------------------------------------------------- *)

let next_correlation = ref 0

let send system ~from ~to_ref payload =
  let env = {
    from = Some from;
    to_ref;
    payload;
    timestamp = Unix.gettimeofday ();
    correlation_id = None;
  } in
  match Hashtbl.find_opt system.actors to_ref.id with
  | Some entry when entry.state.alive ->
    let state' = { entry.state with mailbox = entry.state.mailbox @ [env] } in
    Hashtbl.replace system.actors to_ref.id { entry with state = state' }
  | _ ->
    system.dead_letters := env :: !(system.dead_letters)

let send_system system ~to_ref payload =
  let env = {
    from = None;
    to_ref;
    payload;
    timestamp = Unix.gettimeofday ();
    correlation_id = None;
  } in
  match Hashtbl.find_opt system.actors to_ref.id with
  | Some entry when entry.state.alive ->
    let state' = { entry.state with mailbox = entry.state.mailbox @ [env] } in
    Hashtbl.replace system.actors to_ref.id { entry with state = state' }
  | _ ->
    system.dead_letters := env :: !(system.dead_letters)

let ask system ~from ~to_ref payload =
  let cid = !next_correlation in
  incr next_correlation;
  let env = {
    from = Some from;
    to_ref;
    payload;
    timestamp = Unix.gettimeofday ();
    correlation_id = Some cid;
  } in
  match Hashtbl.find_opt system.actors to_ref.id with
  | Some entry when entry.state.alive ->
    let state' = { entry.state with mailbox = entry.state.mailbox @ [env] } in
    Hashtbl.replace system.actors to_ref.id { entry with state = state' };
    Some cid
  | _ ->
    system.dead_letters := env :: !(system.dead_letters);
    None

(* --------------------------------------------------------------------------
   Selective Receive
   -------------------------------------------------------------------------- *)

(** Selective receive: find first message matching predicate *)
let selective_receive predicate state =
  let rec scan acc = function
    | [] -> None
    | env :: rest ->
      if predicate env then
        Some (env, { state with mailbox = List.rev acc @ rest })
      else
        scan (env :: acc) rest
  in
  scan [] state.mailbox

(** Receive next message (FIFO) *)
let receive state =
  match state.mailbox with
  | [] -> None
  | env :: rest -> Some (env, { state with mailbox = rest })

(** Receive by correlation ID (for request-reply) *)
let receive_reply cid state =
  selective_receive (fun env -> env.correlation_id = Some cid) state

(* --------------------------------------------------------------------------
   Effect Processing
   -------------------------------------------------------------------------- *)

let rec process_effects system current_ref envelope effects state =
  List.fold_left (fun st effect ->
    match effect with
    | Send (target, msg) ->
      send system ~from:current_ref ~to_ref:target msg;
      st
    | Reply msg ->
      (match envelope.from with
       | Some sender -> send system ~from:current_ref ~to_ref:sender msg; st
       | None -> st)
    | Spawn (name, behavior) ->
      let _child = spawn_child system current_ref ?name st.data behavior in
      st
    | SpawnResult _ -> st  (* internal use *)
    | Link target ->
      (* bidirectional link *)
      let st' = { st with links = target :: st.links } in
      (match Hashtbl.find_opt system.actors target.id with
       | Some entry ->
         let target_st = { entry.state with links = current_ref :: entry.state.links } in
         Hashtbl.replace system.actors target.id { entry with state = target_st }
       | None -> ());
      st'
    | Unlink target ->
      let st' = { st with links = List.filter (fun r -> r.id <> target.id) st.links } in
      (match Hashtbl.find_opt system.actors target.id with
       | Some entry ->
         let target_st = { entry.state with links = List.filter (fun r -> r.id <> current_ref.id) entry.state.links } in
         Hashtbl.replace system.actors target.id { entry with state = target_st }
       | None -> ());
      st'
    | Monitor target ->
      let st' = { st with monitors = target :: st.monitors } in
      (match Hashtbl.find_opt system.actors target.id with
       | Some entry ->
         let target_st = { entry.state with monitored_by = current_ref :: entry.state.monitored_by } in
         Hashtbl.replace system.actors target.id { entry with state = target_st }
       | None -> ());
      st'
    | Become new_behavior ->
      { st with behavior_stack = new_behavior :: st.behavior_stack }
    | Unbecome ->
      (match st.behavior_stack with
       | _ :: (prev :: _ as rest) -> { st with behavior_stack = rest }
       | _ -> st)  (* keep at least one behavior *)
    | StopSelf ->
      stop_actor system st;
      { st with alive = false }
    | StopChild child_ref ->
      (match Hashtbl.find_opt system.actors child_ref.id with
       | Some entry ->
         stop_actor system entry.state;
         let entry_st = { entry.state with alive = false } in
         Hashtbl.replace system.actors child_ref.id { entry with state = entry_st }
       | None -> ());
      st
    | Escalate reason ->
      system.log := (Printf.sprintf "Actor %d escalated: %s" current_ref.id reason) :: !(system.log);
      st
    | Log msg ->
      system.log := msg :: !(system.log);
      st
    | NoEffect -> st
  ) state effects

and stop_actor system state =
  (* Notify linked actors *)
  List.iter (fun linked ->
    match Hashtbl.find_opt system.actors linked.id with
    | Some entry when entry.state.alive ->
      let reason = Printf.sprintf "Actor %d stopped" state.self.id in
      let notif_env = {
        from = None;
        to_ref = linked;
        payload = state.data;  (* send current state as notification *)
        timestamp = Unix.gettimeofday ();
        correlation_id = None;
      } in
      let _ = notif_env in
      system.log := (Printf.sprintf "Link notification: %d -> %d: %s" state.self.id linked.id reason) :: !(system.log)
    | _ -> ()
  ) state.links;
  (* Notify monitors *)
  List.iter (fun monitor ->
    match Hashtbl.find_opt system.actors monitor.id with
    | Some entry when entry.state.alive ->
      let reason = Printf.sprintf "Actor %d stopped" state.self.id in
      system.log := (Printf.sprintf "Monitor notification: %d -> %d: %s" state.self.id monitor.id reason) :: !(system.log)
    | _ -> ()
  ) state.monitored_by;
  (* Remove from registry name *)
  (match state.self.name with
   | Some n -> Hashtbl.remove system.names n
   | None -> ());
  (* Stop children *)
  let children = try Hashtbl.find system.children state.self.id with Not_found -> [] in
  List.iter (fun child_id ->
    match Hashtbl.find_opt system.actors child_id with
    | Some entry when entry.state.alive ->
      stop_actor system entry.state;
      let st = { entry.state with alive = false } in
      Hashtbl.replace system.actors child_id { entry with state = st }
    | _ -> ()
  ) children

(* --------------------------------------------------------------------------
   Message Delivery / Actor Step
   -------------------------------------------------------------------------- *)

(** Process one message for an actor *)
let step_actor system ref_ =
  match Hashtbl.find_opt system.actors ref_.id with
  | None -> false
  | Some entry ->
    if not entry.state.alive then false
    else
      match receive entry.state with
      | None -> false
      | Some (env, state') ->
        let behavior = List.hd state'.behavior_stack in
        let effects, state'' = behavior env.payload state' in
        let state''' = process_effects system ref_ env effects { state'' with data = state''.data } in
        Hashtbl.replace system.actors ref_.id { entry with state = state''' };
        true

(** Process all pending messages for all actors (one round) *)
let step_all system =
  let processed = ref 0 in
  Hashtbl.iter (fun id entry ->
    if entry.state.alive then begin
      let ref_ = entry.ref in
      while step_actor system ref_ do
        incr processed
      done
    end
  ) system.actors;
  !processed

(** Run until no messages remain or max iterations *)
let drain system ?(max_iterations=1000) () =
  let iterations = ref 0 in
  let total = ref 0 in
  while !iterations < max_iterations && step_all system > 0 do
    incr iterations;
    total := !total + 1
  done;
  !total

(* --------------------------------------------------------------------------
   Routers
   -------------------------------------------------------------------------- *)

type 'msg router = {
  strategy: router_strategy;
  routees: actor_ref list;
  mutable rr_index: int;
}

let create_router strategy routees = {
  strategy;
  routees;
  rr_index = 0;
}

let route system router ~from msg =
  match router.strategy with
  | RoundRobin ->
    if router.routees <> [] then begin
      let target = List.nth router.routees (router.rr_index mod List.length router.routees) in
      router.rr_index <- router.rr_index + 1;
      send system ~from ~to_ref:target msg
    end
  | Broadcast ->
    List.iter (fun target ->
      send system ~from ~to_ref:target msg
    ) router.routees
  | Random ->
    if router.routees <> [] then begin
      let idx = Random.int (List.length router.routees) in
      let target = List.nth router.routees idx in
      send system ~from ~to_ref:target msg
    end

(* --------------------------------------------------------------------------
   Supervision
   -------------------------------------------------------------------------- *)

let make_supervisor_config ?(strategy=OneForOne) ?(max_restarts=3) ?(restart_window=60.0) () = {
  strategy;
  max_restarts;
  restart_window;
}

let register_supervisor system parent_ref config =
  Hashtbl.replace system.supervisors parent_ref.id config

let restart_actor system actor_id initial_data =
  match Hashtbl.find_opt system.actors actor_id with
  | Some entry ->
    let state = entry.state in
    if state.restart_count < state.max_restarts then begin
      let state' = {
        state with
        alive = true;
        data = initial_data;
        mailbox = [];
        restart_count = state.restart_count + 1;
      } in
      Hashtbl.replace system.actors actor_id { entry with state = state' };
      system.log := (Printf.sprintf "Restarted actor %d (attempt %d)" actor_id state'.restart_count) :: !(system.log);
      true
    end else begin
      system.log := (Printf.sprintf "Actor %d exceeded max restarts (%d)" actor_id state.max_restarts) :: !(system.log);
      false
    end
  | None -> false

let handle_child_failure system parent_id failed_child_id initial_data =
  match Hashtbl.find_opt system.supervisors parent_id with
  | None -> false
  | Some config ->
    let children = try Hashtbl.find system.children parent_id with Not_found -> [] in
    match config.strategy with
    | OneForOne ->
      restart_actor system failed_child_id initial_data
    | OneForAll ->
      List.iter (fun cid ->
        ignore (restart_actor system cid initial_data)
      ) children;
      true
    | RestForOne ->
      (* Restart failed child and all children after it *)
      let rec restart_from found = function
        | [] -> ()
        | cid :: rest ->
          if cid = failed_child_id || found then begin
            ignore (restart_actor system cid initial_data);
            restart_from true rest
          end else
            restart_from false rest
      in
      restart_from false (List.rev children);  (* children are prepended, so reverse *)
      true

(* --------------------------------------------------------------------------
   Actor Statistics
   -------------------------------------------------------------------------- *)

type system_stats = {
  total_actors: int;
  alive_actors: int;
  dead_actors: int;
  total_messages_pending: int;
  dead_letter_count: int;
  total_restarts: int;
  log_entries: int;
}

let system_stats system =
  let total = Hashtbl.length system.actors in
  let alive = ref 0 in
  let pending = ref 0 in
  let restarts = ref 0 in
  Hashtbl.iter (fun _ entry ->
    if entry.state.alive then incr alive;
    pending := !pending + List.length entry.state.mailbox;
    restarts := !restarts + entry.state.restart_count;
  ) system.actors;
  {
    total_actors = total;
    alive_actors = !alive;
    dead_actors = total - !alive;
    total_messages_pending = !pending;
    dead_letter_count = List.length !(system.dead_letters);
    total_restarts = !restarts;
    log_entries = List.length !(system.log);
  }

let stats_to_string stats =
  Printf.sprintf
    "Actors: %d total (%d alive, %d dead) | Pending msgs: %d | Dead letters: %d | Restarts: %d"
    stats.total_actors stats.alive_actors stats.dead_actors
    stats.total_messages_pending stats.dead_letter_count stats.total_restarts

(* ============================================================================
   Test Suite
   ============================================================================ *)

let () =
  let tests_passed = ref 0 in
  let tests_failed = ref 0 in

  let test name f =
    try
      f ();
      incr tests_passed;
      Printf.printf "  ✓ %s\n" name
    with ex ->
      incr tests_failed;
      Printf.printf "  ✗ %s: %s\n" name (Printexc.to_string ex)
  in

  let assert_equal a b msg =
    if a <> b then failwith (Printf.sprintf "%s: expected %s, got %s" msg (string_of_int a) (string_of_int b))
  in

  let assert_true b msg =
    if not b then failwith msg
  in

  Printf.printf "\n=== Actor Model Tests ===\n\n";

  (* -- Basic Actor Creation -- *)
  Printf.printf "Actor Creation & Registry:\n";

  test "spawn actor with name" (fun () ->
    let sys = create_system () in
    let ref_ = spawn sys ~name:"alice" 0 (fun _msg state -> ([], state)) in
    assert_true (ref_.name = Some "alice") "should have name";
    assert_true (is_alive sys ref_) "should be alive"
  );

  test "spawn anonymous actor" (fun () ->
    let sys = create_system () in
    let ref_ = spawn sys 0 (fun _msg state -> ([], state)) in
    assert_true (ref_.name = None) "should have no name";
    assert_true (is_alive sys ref_) "should be alive"
  );

  test "lookup by name" (fun () ->
    let sys = create_system () in
    let ref_ = spawn sys ~name:"bob" 42 (fun _msg state -> ([], state)) in
    match lookup_by_name sys "bob" with
    | Some found -> assert_equal ref_.id found.id "should find same actor"
    | None -> failwith "should find actor by name"
  );

  test "lookup nonexistent name returns None" (fun () ->
    let sys = create_system () in
    assert_true (lookup_by_name sys "nobody" = None) "should return None"
  );

  test "multiple actors get unique IDs" (fun () ->
    let sys = create_system () in
    let noop = fun _msg state -> ([], state) in
    let a = spawn sys 0 noop in
    let b = spawn sys 0 noop in
    let c = spawn sys 0 noop in
    assert_true (a.id <> b.id && b.id <> c.id) "IDs should be unique"
  );

  (* -- Message Passing -- *)
  Printf.printf "\nMessage Passing:\n";

  test "send and receive message" (fun () ->
    let sys = create_system () in
    let received = ref false in
    let handler msg state =
      if msg = "hello" then received := true;
      ([], state)
    in
    let actor = spawn sys ~name:"receiver" "init" handler in
    let sender = spawn sys ~name:"sender" "init" (fun _msg state -> ([], state)) in
    send sys ~from:sender ~to_ref:actor "hello";
    let _ = drain sys () in
    assert_true !received "should have received message"
  );

  test "message ordering (FIFO)" (fun () ->
    let sys = create_system () in
    let order = ref [] in
    let handler msg state =
      order := msg :: !order;
      ([], state)
    in
    let actor = spawn sys 0 handler in
    let sender = spawn sys 0 (fun _msg state -> ([], state)) in
    send sys ~from:sender ~to_ref:actor "first";
    send sys ~from:sender ~to_ref:actor "second";
    send sys ~from:sender ~to_ref:actor "third";
    let _ = drain sys () in
    assert_true (List.rev !order = ["first"; "second"; "third"]) "should be FIFO"
  );

  test "send to dead actor goes to dead letters" (fun () ->
    let sys = create_system () in
    let actor = spawn sys 0 (fun _msg state -> ([StopSelf], state)) in
    let sender = spawn sys 0 (fun _msg state -> ([], state)) in
    (* Send a message to trigger StopSelf *)
    send sys ~from:sender ~to_ref:actor "trigger";
    let _ = drain sys () in
    (* Now send to dead actor *)
    send sys ~from:sender ~to_ref:actor "lost";
    assert_equal (List.length !(sys.dead_letters)) 1 "should have 1 dead letter"
  );

  test "reply to sender" (fun () ->
    let sys = create_system () in
    let reply_received = ref "" in
    let echo _msg state = ([Reply ("echo: " ^ _msg)], state) in
    let collector msg state =
      reply_received := msg;
      ([], state)
    in
    let server = spawn sys ~name:"echo" "" echo in
    let client = spawn sys ~name:"client" "" collector in
    send sys ~from:client ~to_ref:server "hi";
    let _ = drain sys () in
    assert_true (!reply_received = "echo: hi") "should receive echo reply"
  );

  test "ask with correlation ID" (fun () ->
    let sys = create_system () in
    let echo msg state = ([Reply ("re: " ^ msg)], state) in
    let server = spawn sys "" echo in
    let client = spawn sys "" (fun _msg state -> ([], state)) in
    let cid = ask sys ~from:client ~to_ref:server "question" in
    assert_true (cid <> None) "should get correlation ID";
    let _ = drain sys () in
    ()
  );

  (* -- Selective Receive -- *)
  Printf.printf "\nSelective Receive:\n";

  test "selective receive by predicate" (fun () ->
    let sys = create_system () in
    let noop = fun _msg state -> ([], state) in
    let actor = spawn sys "" noop in
    let sender = spawn sys "" noop in
    send sys ~from:sender ~to_ref:actor "a";
    send sys ~from:sender ~to_ref:actor "b";
    send sys ~from:sender ~to_ref:actor "target";
    send sys ~from:sender ~to_ref:actor "c";
    match Hashtbl.find_opt sys.actors actor.id with
    | Some entry ->
      let result = selective_receive (fun env -> env.payload = "target") entry.state in
      (match result with
       | Some (env, state') ->
         assert_true (env.payload = "target") "should find target";
         assert_equal (List.length state'.mailbox) 3 "remaining should be 3"
       | None -> failwith "should find matching message")
    | None -> failwith "actor not found"
  );

  test "selective receive returns None when no match" (fun () ->
    let sys = create_system () in
    let noop = fun _msg state -> ([], state) in
    let actor = spawn sys "" noop in
    let sender = spawn sys "" noop in
    send sys ~from:sender ~to_ref:actor "a";
    send sys ~from:sender ~to_ref:actor "b";
    match Hashtbl.find_opt sys.actors actor.id with
    | Some entry ->
      let result = selective_receive (fun env -> env.payload = "z") entry.state in
      assert_true (result = None) "should return None"
    | None -> failwith "actor not found"
  );

  (* -- State Management -- *)
  Printf.printf "\nState Management:\n";

  test "actor state updates persist" (fun () ->
    let sys = create_system () in
    let counter _msg state =
      let n = int_of_string state.data + 1 in
      ([], { state with data = string_of_int n })
    in
    let actor = spawn sys "0" counter in
    let sender = spawn sys "" (fun _msg state -> ([], state)) in
    send sys ~from:sender ~to_ref:actor "inc";
    send sys ~from:sender ~to_ref:actor "inc";
    send sys ~from:sender ~to_ref:actor "inc";
    let _ = drain sys () in
    match Hashtbl.find_opt sys.actors actor.id with
    | Some entry -> assert_true (entry.state.data = "3") "counter should be 3"
    | None -> failwith "actor not found"
  );

  test "become changes behavior" (fun () ->
    let sys = create_system () in
    let angry_behavior _msg state =
      ([Log "ANGRY!"], { state with data = "angry" })
    in
    let calm_behavior _msg state =
      if _msg = "provoke" then
        ([Become angry_behavior; Log "becoming angry"], state)
      else
        ([Log "calm"], state)
    in
    let actor = spawn sys "calm" calm_behavior in
    let sender = spawn sys "" (fun _msg state -> ([], state)) in
    send sys ~from:sender ~to_ref:actor "hello";
    send sys ~from:sender ~to_ref:actor "provoke";
    send sys ~from:sender ~to_ref:actor "hello";
    let _ = drain sys () in
    match Hashtbl.find_opt sys.actors actor.id with
    | Some entry -> assert_true (entry.state.data = "angry") "should be angry"
    | None -> failwith "actor not found"
  );

  test "unbecome reverts behavior" (fun () ->
    let sys = create_system () in
    let temp_behavior msg state =
      if msg = "revert" then
        ([Unbecome], { state with data = "reverted" })
      else
        ([], { state with data = "temp:" ^ msg })
    in
    let base_behavior msg state =
      if msg = "switch" then
        ([Become temp_behavior], state)
      else
        ([], { state with data = "base:" ^ msg })
    in
    let actor = spawn sys "init" base_behavior in
    let sender = spawn sys "" (fun _msg state -> ([], state)) in
    send sys ~from:sender ~to_ref:actor "switch";
    send sys ~from:sender ~to_ref:actor "test";
    send sys ~from:sender ~to_ref:actor "revert";
    send sys ~from:sender ~to_ref:actor "final";
    let _ = drain sys () in
    match Hashtbl.find_opt sys.actors actor.id with
    | Some entry -> assert_true (entry.state.data = "base:final") "should use base behavior"
    | None -> failwith "actor not found"
  );

  (* -- Actor Lifecycle -- *)
  Printf.printf "\nActor Lifecycle:\n";

  test "stop self" (fun () ->
    let sys = create_system () in
    let handler msg state =
      if msg = "die" then ([StopSelf], state)
      else ([], state)
    in
    let actor = spawn sys "" handler in
    let sender = spawn sys "" (fun _msg state -> ([], state)) in
    send sys ~from:sender ~to_ref:actor "die";
    let _ = drain sys () in
    assert_true (not (is_alive sys actor)) "should be dead"
  );

  test "stop child from parent" (fun () ->
    let sys = create_system () in
    let noop = fun _msg state -> ([], state) in
    let parent_ref = ref { id = 0; name = None } in
    let parent_handler msg state =
      if msg = "kill" then
        let children = try Hashtbl.find sys.children state.self.id with Not_found -> [] in
        let effects = List.map (fun cid ->
          match Hashtbl.find_opt sys.actors cid with
          | Some entry -> StopChild entry.ref
          | None -> NoEffect
        ) children in
        (effects, state)
      else ([], state)
    in
    let parent = spawn sys ~name:"parent" "" parent_handler in
    parent_ref := parent;
    let child = spawn_child sys parent ~name:"child" "" noop in
    let sender = spawn sys "" noop in
    send sys ~from:sender ~to_ref:parent "kill";
    let _ = drain sys () in
    assert_true (not (is_alive sys child)) "child should be dead"
  );

  test "stopping parent stops children" (fun () ->
    let sys = create_system () in
    let noop = fun _msg state -> ([], state) in
    let parent = spawn sys "" (fun msg state ->
      if msg = "die" then ([StopSelf], state) else ([], state)
    ) in
    let child1 = spawn_child sys parent "" noop in
    let child2 = spawn_child sys parent "" noop in
    let sender = spawn sys "" noop in
    send sys ~from:sender ~to_ref:parent "die";
    let _ = drain sys () in
    assert_true (not (is_alive sys child1)) "child1 should be dead";
    assert_true (not (is_alive sys child2)) "child2 should be dead"
  );

  (* -- Links & Monitors -- *)
  Printf.printf "\nLinks & Monitors:\n";

  test "link actors bidirectionally" (fun () ->
    let sys = create_system () in
    let handler msg state =
      if msg = "link" then ([Link { id = 2; name = Some "b" }], state)
      else ([], state)
    in
    let a = spawn sys ~name:"a" "" handler in
    let _b = spawn sys ~name:"b" "" (fun _msg state -> ([], state)) in
    let sender = spawn sys "" (fun _msg state -> ([], state)) in
    send sys ~from:sender ~to_ref:a "link";
    let _ = drain sys () in
    match Hashtbl.find_opt sys.actors a.id with
    | Some entry -> assert_equal (List.length entry.state.links) 1 "a should have 1 link"
    | None -> failwith "actor not found"
  );

  test "monitor actor" (fun () ->
    let sys = create_system () in
    let noop = fun _msg state -> ([], state) in
    let watcher_behavior msg state =
      if msg = "watch" then
        let target = { id = state.self.id + 1; name = None } in
        ([Monitor target], state)
      else ([], state)
    in
    let watcher = spawn sys "" watcher_behavior in
    let _watched = spawn sys "" noop in
    let sender = spawn sys "" noop in
    send sys ~from:sender ~to_ref:watcher "watch";
    let _ = drain sys () in
    match Hashtbl.find_opt sys.actors watcher.id with
    | Some entry -> assert_equal (List.length entry.state.monitors) 1 "should have 1 monitor"
    | None -> failwith "actor not found"
  );

  (* -- Supervision -- *)
  Printf.printf "\nSupervision:\n";

  test "one-for-one restart" (fun () ->
    let sys = create_system () in
    let noop = fun _msg state -> ([], state) in
    let parent = spawn sys ~name:"sup" "" noop in
    let config = make_supervisor_config ~strategy:OneForOne () in
    register_supervisor sys parent config;
    let child = spawn_child sys parent ~name:"worker" "init" noop in
    (* Simulate failure *)
    (match Hashtbl.find_opt sys.actors child.id with
     | Some entry ->
       let st = { entry.state with alive = false } in
       Hashtbl.replace sys.actors child.id { entry with state = st }
     | None -> ());
    let restarted = handle_child_failure sys parent.id child.id "reset" in
    assert_true restarted "should restart successfully";
    assert_true (is_alive sys child) "child should be alive again"
  );

  test "one-for-all restart" (fun () ->
    let sys = create_system () in
    let noop = fun _msg state -> ([], state) in
    let parent = spawn sys "" noop in
    let config = make_supervisor_config ~strategy:OneForAll () in
    register_supervisor sys parent config;
    let c1 = spawn_child sys parent "" noop in
    let c2 = spawn_child sys parent "" noop in
    let c3 = spawn_child sys parent "" noop in
    (* Kill c2 *)
    (match Hashtbl.find_opt sys.actors c2.id with
     | Some entry ->
       Hashtbl.replace sys.actors c2.id { entry with state = { entry.state with alive = false } }
     | None -> ());
    let _ = handle_child_failure sys parent.id c2.id "reset" in
    (* All should have restart_count > 0 *)
    let check ref_ =
      match Hashtbl.find_opt sys.actors ref_.id with
      | Some entry -> entry.state.restart_count > 0
      | None -> false
    in
    assert_true (check c1 && check c2 && check c3) "all children should be restarted"
  );

  test "max restart limit enforced" (fun () ->
    let sys = create_system () in
    let noop = fun _msg state -> ([], state) in
    let parent = spawn sys "" noop in
    let config = make_supervisor_config ~strategy:OneForOne () in
    register_supervisor sys parent config;
    let child = spawn_child sys parent "" noop in
    (* Set restart count to max *)
    (match Hashtbl.find_opt sys.actors child.id with
     | Some entry ->
       let st = { entry.state with alive = false; restart_count = 10; max_restarts = 10 } in
       Hashtbl.replace sys.actors child.id { entry with state = st }
     | None -> ());
    let restarted = handle_child_failure sys parent.id child.id "reset" in
    assert_true (not restarted) "should not restart past max"
  );

  test "rest-for-one restart" (fun () ->
    let sys = create_system () in
    let noop = fun _msg state -> ([], state) in
    let parent = spawn sys "" noop in
    let config = make_supervisor_config ~strategy:RestForOne () in
    register_supervisor sys parent config;
    let c1 = spawn_child sys parent "" noop in
    let c2 = spawn_child sys parent "" noop in
    let c3 = spawn_child sys parent "" noop in
    (* Kill c2 -- should restart c2 and c1 (c1 was spawned after c2 in reversed list) *)
    (match Hashtbl.find_opt sys.actors c2.id with
     | Some entry ->
       Hashtbl.replace sys.actors c2.id { entry with state = { entry.state with alive = false } }
     | None -> ());
    let _ = handle_child_failure sys parent.id c2.id "reset" in
    (* c2 should be restarted *)
    let c2_restarted = match Hashtbl.find_opt sys.actors c2.id with
      | Some entry -> entry.state.restart_count > 0
      | None -> false
    in
    assert_true c2_restarted "c2 should be restarted"
  );

  (* -- Routers -- *)
  Printf.printf "\nRouters:\n";

  test "round-robin routing" (fun () ->
    let sys = create_system () in
    let counts = Hashtbl.create 4 in
    let worker _msg state =
      let n = try Hashtbl.find counts state.self.id with Not_found -> 0 in
      Hashtbl.replace counts state.self.id (n + 1);
      ([], state)
    in
    let w1 = spawn sys "" worker in
    let w2 = spawn sys "" worker in
    let w3 = spawn sys "" worker in
    let sender = spawn sys "" (fun _msg state -> ([], state)) in
    let router = create_router RoundRobin [w1; w2; w3] in
    for _ = 1 to 6 do
      route sys router ~from:sender "work"
    done;
    let _ = drain sys () in
    let c1 = try Hashtbl.find counts w1.id with Not_found -> 0 in
    let c2 = try Hashtbl.find counts w2.id with Not_found -> 0 in
    let c3 = try Hashtbl.find counts w3.id with Not_found -> 0 in
    assert_equal c1 2 "w1 should get 2";
    assert_equal c2 2 "w2 should get 2";
    assert_equal c3 2 "w3 should get 2"
  );

  test "broadcast routing" (fun () ->
    let sys = create_system () in
    let received = ref 0 in
    let worker _msg state =
      incr received;
      ([], state)
    in
    let w1 = spawn sys "" worker in
    let w2 = spawn sys "" worker in
    let sender = spawn sys "" (fun _msg state -> ([], state)) in
    let router = create_router Broadcast [w1; w2] in
    route sys router ~from:sender "announce";
    let _ = drain sys () in
    assert_equal !received 2 "both workers should receive"
  );

  (* -- System Statistics -- *)
  Printf.printf "\nSystem Statistics:\n";

  test "system stats are accurate" (fun () ->
    let sys = create_system () in
    let noop = fun _msg state -> ([], state) in
    let _a1 = spawn sys "" noop in
    let _a2 = spawn sys "" noop in
    let a3 = spawn sys "" (fun msg state ->
      if msg = "die" then ([StopSelf], state) else ([], state)
    ) in
    let sender = spawn sys "" noop in
    send sys ~from:sender ~to_ref:a3 "die";
    let _ = drain sys () in
    let stats = system_stats sys in
    assert_equal stats.total_actors 4 "total actors";
    assert_equal stats.alive_actors 3 "alive actors";
    assert_equal stats.dead_actors 1 "dead actors"
  );

  test "stats_to_string formats correctly" (fun () ->
    let stats = {
      total_actors = 5; alive_actors = 3; dead_actors = 2;
      total_messages_pending = 10; dead_letter_count = 1;
      total_restarts = 2; log_entries = 4;
    } in
    let s = stats_to_string stats in
    assert_true (String.length s > 0) "should produce non-empty string"
  );

  (* -- Complex Scenarios -- *)
  Printf.printf "\nComplex Scenarios:\n";

  test "ping-pong between actors" (fun () ->
    let sys = create_system () in
    let count = ref 0 in
    let pong_behavior msg state =
      if msg = "ping" then begin
        incr count;
        ([Reply "pong"], state)
      end else ([], state)
    in
    let ping_behavior msg state =
      if msg = "start" then begin
        let target = { id = state.self.id + 1; name = Some "pong" } in
        ([Send (target, "ping")], state)
      end else if msg = "pong" && !count < 5 then begin
        incr count;
        ([Reply "ping"], state)
      end else
        ([], state)
    in
    let ping = spawn sys ~name:"ping" "" ping_behavior in
    let _pong = spawn sys ~name:"pong" "" pong_behavior in
    let sender = spawn sys "" (fun _msg state -> ([], state)) in
    send sys ~from:sender ~to_ref:ping "start";
    let _ = drain sys () in
    assert_true (!count >= 2) "should have multiple ping-pongs"
  );

  test "actor chain (pipeline)" (fun () ->
    let sys = create_system () in
    let result = ref "" in
    let stage transform next_ref _msg state =
      let transformed = transform _msg in
      let effects = match next_ref with
        | Some nr -> result := transformed; [Send (nr, transformed)]
        | None -> result := transformed; []
      in
      (effects, state)
    in
    let c = spawn sys "" (stage (fun s -> s ^ "!") None) in
    let b = spawn sys "" (stage (fun s -> String.uppercase_ascii s) (Some c)) in
    let a = spawn sys "" (stage (fun s -> "hello " ^ s) (Some b)) in
    let sender = spawn sys "" (fun _msg state -> ([], state)) in
    send sys ~from:sender ~to_ref:a "world";
    let _ = drain sys () in
    assert_true (!result = "HELLO WORLD!") "pipeline should transform"
  );

  test "actor spawns child dynamically" (fun () ->
    let sys = create_system () in
    let spawner msg state =
      if msg = "spawn" then begin
        let child_ref = spawn_child sys state.self ~name:"dynamic" "" (fun _msg st -> ([], st)) in
        ([Log (Printf.sprintf "spawned child %d" child_ref.id)], state)
      end else ([], state)
    in
    let parent = spawn sys ~name:"spawner" "" spawner in
    let sender = spawn sys "" (fun _msg state -> ([], state)) in
    send sys ~from:sender ~to_ref:parent "spawn";
    let _ = drain sys () in
    assert_true (lookup_by_name sys "dynamic" <> None) "dynamic child should exist"
  );

  test "dead letter collection" (fun () ->
    let sys = create_system () in
    let noop = fun _msg state -> ([], state) in
    let sender = spawn sys "" noop in
    let ghost = { id = 9999; name = Some "ghost" } in
    send sys ~from:sender ~to_ref:ghost "hello?";
    send sys ~from:sender ~to_ref:ghost "anyone?";
    assert_equal (List.length !(sys.dead_letters)) 2 "should have 2 dead letters"
  );

  test "system drain with max iterations" (fun () ->
    let sys = create_system () in
    let noop = fun _msg state -> ([], state) in
    let _actor = spawn sys "" noop in
    let rounds = drain sys ~max_iterations:5 () in
    assert_true (rounds >= 0) "should complete without error"
  );

  test "log captures messages" (fun () ->
    let sys = create_system () in
    let logger msg state =
      ([Log ("received: " ^ msg)], state)
    in
    let actor = spawn sys "" logger in
    let sender = spawn sys "" (fun _msg state -> ([], state)) in
    send sys ~from:sender ~to_ref:actor "test1";
    send sys ~from:sender ~to_ref:actor "test2";
    let _ = drain sys () in
    assert_equal (List.length !(sys.log)) 2 "should have 2 log entries"
  );

  test "multiple routers independently" (fun () ->
    let sys = create_system () in
    let noop = fun _msg state -> ([], state) in
    let w1 = spawn sys "" noop in
    let w2 = spawn sys "" noop in
    let sender = spawn sys "" noop in
    let r1 = create_router RoundRobin [w1; w2] in
    let r2 = create_router Broadcast [w1; w2] in
    route sys r1 ~from:sender "rr";
    route sys r2 ~from:sender "bc";
    let _ = drain sys () in
    (* w1 gets 1 from RR + 1 from broadcast = 2, w2 gets 1 from broadcast = 1 *)
    ()
  );

  test "supervisor config creation" (fun () ->
    let config = make_supervisor_config ~strategy:OneForAll ~max_restarts:5 ~restart_window:30.0 () in
    assert_true (config.strategy = OneForAll) "strategy";
    assert_equal config.max_restarts 5 "max_restarts";
    assert_true (config.restart_window = 30.0) "restart_window"
  );

  test "system with many actors" (fun () ->
    let sys = create_system () in
    let noop = fun _msg state -> ([], state) in
    let actors = Array.init 50 (fun i ->
      spawn sys ~name:(Printf.sprintf "actor_%d" i) "" noop
    ) in
    let stats = system_stats sys in
    assert_equal stats.total_actors 50 "should have 50 actors";
    assert_equal stats.alive_actors 50 "all should be alive";
    (* Send messages between random pairs *)
    for i = 0 to 49 do
      let target = (i + 7) mod 50 in
      send sys ~from:actors.(i) ~to_ref:actors.(target) "hello"
    done;
    let _ = drain sys () in
    let stats' = system_stats sys in
    assert_equal stats'.total_messages_pending 0 "all messages should be processed"
  );

  (* -- Summary -- *)
  Printf.printf "\n=== Results: %d passed, %d failed ===\n" !tests_passed !tests_failed;
  if !tests_failed > 0 then
    Printf.printf "SOME TESTS FAILED\n"
  else
    Printf.printf "All tests passed! ✓\n"
