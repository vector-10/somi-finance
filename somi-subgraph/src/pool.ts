import { BigInt, Address, ethereum } from "@graphprotocol/graph-ts";
import { Deposited, Claimed } from "../generated/SavingsPool/SavingsPool";
import { Totals, SoloDeposit, Claim } from "../generated/schema";

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

export function handleDeposited(event: Deposited): void {
  let id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let d = new SoloDeposit(id);
  d.user = event.params.user;
  d.planId = event.params.planId;
  d.amount = event.params.amount;
  d.startTime = event.block.timestamp;
  d.claimed = false;
  d.principal = event.params.amount;
  d.receiptId = event.params.receiptId;
  d.txHash = event.transaction.hash;
  d.save();

  let t = totals();
  t.totalSTTLocked = t.totalSTTLocked.plus(event.params.amount);
  // naive depositor count bump (ok for hackathon)
  t.totalDepositors = t.totalDepositors.plus(BigInt.fromI32(1));
  t.save();
}

export function handleClaimed(event: Claimed): void {
  // Find the deposit by receipt if you prefer; here we link by tx+index for simplicity
  let id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  // record claim
  let c = new Claim(id);
  c.user = event.params.user;
  c.kind = "solo";
  c.principal = event.params.principal;
  c.interest = event.params.interest;
  c.penaltyShare = null;
  c.timestamp = event.block.timestamp;
  c.txHash = event.transaction.hash;
  c.refId = event.params.planId.toString();
  c.save();

  // TVL decreases by principal
  let t = totals();
  t.totalSTTLocked = t.totalSTTLocked.minus(event.params.principal);
  t.totalClaims = t.totalClaims.plus(BigInt.fromI32(1));
  t.save();
}
