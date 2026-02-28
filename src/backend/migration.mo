import Map "mo:core/Map";
import Set "mo:core/Set";

module {
  type Actor = {
    userProfiles : Map.Map<Principal, { name : Text }>;
    comics : Map.Map<Nat, {
      id : Nat;
      title : Text;
      coverBlobId : ?Text;
      genres : [Text];
      status : Text;
      synopsis : Text;
      sourceType : Text;
      isExplicit : Bool;
      createdAt : Int;
      updatedAt : Int;
      viewCount : Nat;
    }>;
    chapters : Map.Map<Nat, {
      id : Nat;
      comicId : Nat;
      chapterNumber : Float;
      title : Text;
      createdAt : Int;
      mangadexChapterId : ?Text;
    }>;
    pages : Map.Map<Nat, {
      id : Nat;
      chapterId : Nat;
      pageNumber : Nat;
      blobId : Text;
    }>;
    comments : Map.Map<Nat, {
      id : Nat;
      comicId : Nat;
      userId : Principal;
      username : Text;
      text : Text;
      createdAt : Int;
    }>;
    genres : Set.Set<Text>;
    titles : Set.Set<Text>;
    comicIdCounter : Nat;
    chapterIdCounter : Nat;
    pageIdCounter : Nat;
    commentIdCounter : Nat;
  };

  public func run(old : Actor) : Actor {
    old;
  };
};

