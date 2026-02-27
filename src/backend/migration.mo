import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Set "mo:core/Set";

module {
  type OldComic = {
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
  };

  type OldChapter = {
    id : Nat;
    comicId : Nat;
    chapterNumber : Float;
    title : Text;
    createdAt : Int;
  };

  type OldPage = {
    id : Nat;
    chapterId : Nat;
    pageNumber : Nat;
    blobId : Text;
  };

  type OldComment = {
    id : Nat;
    comicId : Nat;
    userId : Principal;
    username : Text;
    text : Text;
    createdAt : Int;
  };

  type OldActor = {
    userProfiles : Map.Map<Principal, { name : Text }>;
    comics : Map.Map<Nat, OldComic>;
    chapters : Map.Map<Nat, OldChapter>;
    pages : Map.Map<Nat, OldPage>;
    comments : Map.Map<Nat, OldComment>;
    genres : Set.Set<Text>;
    titles : Set.Set<Text>;
    comicIdCounter : Nat;
    chapterIdCounter : Nat;
    pageIdCounter : Nat;
    commentIdCounter : Nat;
  };

  type NewComic = {
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
  };

  type NewChapter = {
    id : Nat;
    comicId : Nat;
    chapterNumber : Float;
    title : Text;
    createdAt : Int;
    mangadexChapterId : ?Text;
  };

  type NewPage = {
    id : Nat;
    chapterId : Nat;
    pageNumber : Nat;
    blobId : Text;
  };

  type NewComment = {
    id : Nat;
    comicId : Nat;
    userId : Principal;
    username : Text;
    text : Text;
    createdAt : Int;
  };

  type NewActor = {
    userProfiles : Map.Map<Principal, { name : Text }>;
    comics : Map.Map<Nat, NewComic>;
    chapters : Map.Map<Nat, NewChapter>;
    pages : Map.Map<Nat, NewPage>;
    comments : Map.Map<Nat, NewComment>;
    genres : Set.Set<Text>;
    titles : Set.Set<Text>;
    comicIdCounter : Nat;
    chapterIdCounter : Nat;
    pageIdCounter : Nat;
    commentIdCounter : Nat;
  };

  public func run(old : OldActor) : NewActor {
    let newChapters = old.chapters.map<Nat, OldChapter, NewChapter>(
      func(_id, oldChapter) {
        { oldChapter with mangadexChapterId = null };
      }
    );
    { old with chapters = newChapters };
  };
};
