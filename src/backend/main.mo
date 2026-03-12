import Text "mo:core/Text";

actor {
  stable var visitorCount : Nat = 0;

  public shared ({ caller }) func greet(name : Text) : async Text {
    "Hello, " # name # "! Welcome to your Homestead Planner.";
  };

  public func incrementVisitorCount() : async Nat {
    visitorCount += 1;
    visitorCount;
  };

  public query func getVisitorCount() : async Nat {
    visitorCount;
  };
};
