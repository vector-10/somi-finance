import { BigInt } from "@graphprotocol/graph-ts";
import {
  PodCreated, Joined, Activated, EarlyExit, Claimed, Cancelled
} from "../generated/PodsVault/PodsVault";
import {
  Totals, Pod, PodMember, Claim, PenaltyPoolSnapshot
} from "../generated/schema";

function totals(): Totals {
  let t = Totals.load("global");
  if (t == null) {
    t = new Totals("global");
    t.totalSTTLocked = BigInt.zero();
    t.totalActivePods = BigInt.zero();
    t.totalClaims = BigInt.zero();
    t.totalDepositors = BigInt.zero();
  }
  return t as Totals;
}

export function handlePodCreated(event: PodCreated): void {
  let p = new Pod(event.params.podId.toString());
  // You won’t have full config in this event; okay for hackathon.
  // The UI can read live config from contract or you can extend the event later.
  p.term = BigInt.zero();            // optional: fetch via call if you want
  p.deadline = BigInt.zero();
  p.aprBps = BigInt.zero();
  p.bonusAprBps = BigInt.zero();
  p.penaltyBps = BigInt.zero();
  p.minMembers = BigInt.zero();
  p.maxMembers = BigInt.zero();
  p.allowEarlyExit = true;
  p.depositPerMember = BigInt.zero();

  p.activated = false;
  p.cancelled = false;
  p.bonusApplied = false;
  p.membersJoined = BigInt.zero();
  p.activeMembers = BigInt.zero();
  p.totalDeposited = BigInt.zero();
  p.penaltyPool = BigInt.zero();

  p.save();
}

export function handleJoined(event: Joined): void {
  let pid = event.params.podId.toString();

  // Pod counters
  let p = Pod.load(pid)!;
  p.membersJoined = p.membersJoined.plus(BigInt.fromI32(1));
  p.activeMembers = p.activeMembers.plus(BigInt.fromI32(1));
  p.totalDeposited = p.totalDeposited.plus(event.params.amount);
  p.save();

  // Member
  let mid = pid + "-" + event.params.user.toHex();
  let m = new PodMember(mid);
  m.podId = event.params.podId;
  m.user = event.params.user;
  m.joinedAt = event.block.timestamp;
  m.receiptId = event.params.receiptId;
  m.deposit = event.params.amount;
  m.save();

  // TVL++
  let t = totals();
  t.totalSTTLocked = t.totalSTTLocked.plus(event.params.amount);
  t.totalDepositors = t.totalDepositors.plus(BigInt.fromI32(1));
  t.save();
}

export function handleActivated(event: Activated): void {
  let p = Pod.load(event.params.podId.toString())!;
  p.activated = true;
  p.startTime = BigInt.fromI32(event.params.startTime);
  p.maturityTime = BigInt.fromI32(event.params.maturityTime);
  p.aprBps = BigInt.fromI32(event.params.aprBpsEffective);
  p.save();
}

export function handleEarlyExit(event: EarlyExit): void {
  let pid = event.params.podId.toString();
  let p = Pod.load(pid)!;

  // mark member exit (if you want: update PodMember.exitedAt)
  let mid = pid + "-" + event.params.user.toHex();
  let m = PodMember.load(mid);
  if (m != null) {
    m.exitedAt = event.block.timestamp;
    m.save();
  }

  // counters & penalty pool
  p.activeMembers = p.activeMembers.minus(BigInt.fromI32(1));
  p.penaltyPool = p.penaltyPool.plus(event.params.penalty);
  p.save();

  // TVL decreases by refund principal
  let t = totals();
  t.totalSTTLocked = t.totalSTTLocked.minus(event.params.refund);
  t.save();

  // snapshot (optional but nice)
  let sid = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let s = new PenaltyPoolSnapshot(sid);
  s.podId = event.params.podId;
  s.value = p.penaltyPool; // after addition
  s.reason = "earlyExit";
  s.timestamp = event.block.timestamp;
  s.txHash = event.transaction.hash;
  s.save();
}

export function handlePodClaimed(event: Claimed): void {
  let pid = event.params.podId.toString();
  let p = Pod.load(pid)!;

  // claim record
  let id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let c = new Claim(id);
  c.user = event.params.user;
  c.kind = "pod";
  c.principal = event.params.principal;
  c.interest = event.params.interest;
  c.penaltyShare = event.params.penaltyShare;
  c.timestamp = event.block.timestamp;
  c.txHash = event.transaction.hash;
  c.refId = pid;
  c.save();

  // activeMembers-- handled in contract; we mirror only if needed for UI.
  // TVL decreases by principal only
  let t = totals();
  t.totalSTTLocked = t.totalSTTLocked.minus(event.params.principal);
  t.totalClaims = t.totalClaims.plus(BigInt.fromI32(1));
  t.save();

  // optional snapshot after distribution
  let sid = id + "-snap";
  let s = new PenaltyPoolSnapshot(sid);
  s.podId = event.params.podId;
  s.value = p.penaltyPool; // whatever remains after claim
  s.reason = "claim";
  s.timestamp = event.block.timestamp;
  s.txHash = event.transaction.hash;
  s.save();
}

export function handleCancelled(event: Cancelled): void {
  let p = Pod.load(event.params.podId.toString())!;
  p.cancelled = true;
  p.save();
}
