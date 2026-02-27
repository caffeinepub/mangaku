import Map "mo:core/Map";
import Set "mo:core/Set";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Bool "mo:core/Bool";
import Order "mo:core/Order";
import Float "mo:core/Float";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import ExternalBlob "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import OutCall "http-outcalls/outcall";
import Int "mo:core/Int";

actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // User Profile System
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Comic Types
  public type Comic = {
    id : Nat;
    title : Text;
    coverBlobId : ?Text;
    genres : [Text];
    status : Text;
    synopsis : Text;
    sourceType : Text;
    isExplicit : Bool;
    createdAt : Time.Time;
    updatedAt : Time.Time;
    viewCount : Nat;
  };

  public type Chapter = {
    id : Nat;
    comicId : Nat;
    chapterNumber : Float;
    title : Text;
    createdAt : Time.Time;
  };

  public type Page = {
    id : Nat;
    chapterId : Nat;
    pageNumber : Nat;
    blobId : Text;
  };

  public type Comment = {
    id : Nat;
    comicId : Nat;
    userId : Principal;
    username : Text;
    text : Text;
    createdAt : Time.Time;
  };

  module Comic {
    public func compareByUpdatedAt(a : Comic, b : Comic) : Order.Order {
      Int.compare(b.updatedAt, a.updatedAt);
    };

    public func compareByViewCount(a : Comic, b : Comic) : Order.Order {
      Nat.compare(b.viewCount, a.viewCount);
    };

    public func compareByTitle(a : Comic, b : Comic) : Order.Order {
      Text.compare(a.title, b.title);
    };
  };

  let comics = Map.empty<Nat, Comic>();
  let chapters = Map.empty<Nat, Chapter>();
  let pages = Map.empty<Nat, Page>();
  let comments = Map.empty<Nat, Comment>();
  let genres = Set.empty<Text>();
  let titles = Set.empty<Text>();

  var comicIdCounter = 0;
  var chapterIdCounter = 0;
  var pageIdCounter = 0;
  var commentIdCounter = 0;

  func isUniqueArray(array : [Text]) : Bool {
    let set = Set.empty<Text>();
    for (item in array.values()) {
      if (set.contains(item)) {
        return false;
      };
      set.add(item);
    };
    true;
  };

  func normalizeTitle(title : Text) : Text {
    title.trim(#char(' ')).toLower();
  };

  // Admin-only: Create comic
  public shared ({ caller }) func createComic(title : Text, coverBlobId : ?Text, genresInput : [Text], status : Text, synopsis : Text, sourceType : Text, isExplicit : Bool) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create comics");
    };

    if (title.size() < 3 or title.size() > 100) {
      Runtime.trap("Title must be between 3 and 100 characters");
    };

    let normalized = normalizeTitle(title);
    if (titles.contains(normalized)) {
      Runtime.trap("Title must be unique");
    };

    if (not isUniqueArray(genresInput)) {
      Runtime.trap("Genres must be unique");
    };

    if (status != "ongoing" and status != "completed" and status != "hiatus") {
      Runtime.trap("Invalid status");
    };

    comicIdCounter += 1;
    let id = comicIdCounter;
    let now = Time.now();

    let comic : Comic = {
      id;
      title;
      coverBlobId;
      genres = genresInput;
      status;
      synopsis;
      sourceType;
      isExplicit;
      createdAt = now;
      updatedAt = now;
      viewCount = 0;
    };

    comics.add(id, comic);
    titles.add(normalized);
    for (genre in genresInput.values()) {
      genres.add(genre);
    };

    id;
  };

  // Admin-only: Update comic
  public shared ({ caller }) func updateComic(id : Nat, title : Text, coverBlobId : ?Text, genresInput : [Text], status : Text, synopsis : Text, sourceType : Text, isExplicit : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update comics");
    };

    let existing = switch (comics.get(id)) {
      case (null) { Runtime.trap("Comic not found") };
      case (?comic) { comic };
    };

    let normalized = normalizeTitle(title);
    if (normalized != normalizeTitle(existing.title) and titles.contains(normalized)) {
      Runtime.trap("Title must be unique");
    };

    if (not isUniqueArray(genresInput)) {
      Runtime.trap("Genres must be unique");
    };

    if (status != "ongoing" and status != "completed" and status != "hiatus") {
      Runtime.trap("Invalid status");
    };

    let updatedComic = {
      id;
      title;
      coverBlobId;
      genres = genresInput;
      status;
      synopsis;
      sourceType;
      isExplicit;
      createdAt = existing.createdAt;
      updatedAt = Time.now();
      viewCount = existing.viewCount;
    };

    comics.add(id, updatedComic);
  };

  // Admin-only: Delete comic
  public shared ({ caller }) func deleteComic(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete comics");
    };

    switch (comics.get(id)) {
      case (null) { Runtime.trap("Comic not found") };
      case (?_) {};
    };
    comics.remove(id);
  };

  // Public/User: Get comic (with explicit content filtering)
  public query ({ caller }) func getComic(id : Nat) : async Comic {
    let comic = switch (comics.get(id)) {
      case (null) { Runtime.trap("Comic not found") };
      case (?comic) { comic };
    };

    // Check explicit content access
    if (comic.isExplicit) {
      // Explicit comics require at least user role (logged in)
      if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
        Runtime.trap("Unauthorized: Must be logged in to view explicit content");
      };
    };

    comic;
  };

  // Public: Increment view count (anyone can view)
  public shared ({ caller }) func incrementViewCount(comicId : Nat) : async () {
    let comic = switch (comics.get(comicId)) {
      case (null) { Runtime.trap("Comic not found") };
      case (?comic) { comic };
    };

    // Check explicit content access
    if (comic.isExplicit) {
      if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
        Runtime.trap("Unauthorized: Must be logged in to view explicit content");
      };
    };

    let updated = {
      comic with
      viewCount = comic.viewCount + 1;
    };
    comics.add(comicId, updated);
  };

  // Admin-only: Create chapter
  public shared ({ caller }) func createChapter(comicId : Nat, chapterNumber : Float, title : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create chapters");
    };

    switch (comics.get(comicId)) {
      case (null) { Runtime.trap("Comic not found") };
      case (?_) {};
    };

    chapterIdCounter += 1;
    let id = chapterIdCounter;
    let now = Time.now();

    let chapter : Chapter = {
      id;
      comicId;
      chapterNumber;
      title;
      createdAt = now;
    };
    chapters.add(id, chapter);
    id;
  };

  // Admin-only: Delete chapter
  public shared ({ caller }) func deleteChapter(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete chapters");
    };

    switch (chapters.get(id)) {
      case (null) { Runtime.trap("Chapter not found") };
      case (?_) {};
    };
    chapters.remove(id);
  };

  // Public/User: List chapters (with explicit content filtering)
  public query ({ caller }) func listChaptersByComic(comicId : Nat) : async [Chapter] {
    let comic = switch (comics.get(comicId)) {
      case (null) { Runtime.trap("Comic not found") };
      case (?comic) { comic };
    };

    // Check explicit content access
    if (comic.isExplicit) {
      if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
        Runtime.trap("Unauthorized: Must be logged in to view explicit content");
      };
    };

    let result = chapters.values().toArray().filter(
      func(chapter : Chapter) : Bool {
        chapter.comicId == comicId;
      },
    );
    result;
  };

  // Admin-only: Add page
  public shared ({ caller }) func addPage(chapterId : Nat, pageNumber : Nat, blobId : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add pages");
    };

    switch (chapters.get(chapterId)) {
      case (null) { Runtime.trap("Chapter not found") };
      case (?_) {};
    };

    pageIdCounter += 1;
    let id = pageIdCounter;

    let page : Page = {
      id;
      chapterId;
      pageNumber;
      blobId;
    };
    pages.add(id, page);
    id;
  };

  // Public/User: List pages (with explicit content filtering)
  public query ({ caller }) func listPagesByChapter(chapterId : Nat) : async [Page] {
    let chapter = switch (chapters.get(chapterId)) {
      case (null) { Runtime.trap("Chapter not found") };
      case (?chapter) { chapter };
    };

    let comic = switch (comics.get(chapter.comicId)) {
      case (null) { Runtime.trap("Comic not found") };
      case (?comic) { comic };
    };

    // Check explicit content access
    if (comic.isExplicit) {
      if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
        Runtime.trap("Unauthorized: Must be logged in to view explicit content");
      };
    };

    let result = pages.values().toArray().filter(
      func(page : Page) : Bool {
        page.chapterId == chapterId;
      },
    );
    result;
  };

  // User-only: Add comment
  public shared ({ caller }) func addComment(comicId : Nat, _username : Text, text : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only logged-in users can add comments");
    };

    switch (comics.get(comicId)) {
      case (null) { Runtime.trap("Comic not found") };
      case (?_) {};
    };

    commentIdCounter += 1;
    let id = commentIdCounter;
    let now = Time.now();

    let comment : Comment = {
      id;
      comicId;
      userId = caller;
      username = _username;
      text;
      createdAt = now;
    };
    comments.add(id, comment);
  };

  // Public: List comments (anyone can read)
  public query ({ caller }) func listCommentsByComic(comicId : Nat) : async [Comment] {
    let result = comments.values().toArray().filter(
      func(comment : Comment) : Bool {
        comment.comicId == comicId;
      },
    );
    result;
  };

  // Admin-only: Delete comment
  public shared ({ caller }) func deleteComment(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete comments");
    };

    switch (comments.get(id)) {
      case (null) { Runtime.trap("Comment not found") };
      case (?_) {};
    };
    comments.remove(id);
  };

  // Public: List all comics (with explicit content filtering)
  public query ({ caller }) func listComics(page : Nat, pageSize : Nat, sortBy : Text) : async [Comic] {
    let userRole = AccessControl.getUserRole(accessControlState, caller);
    let isLoggedIn = AccessControl.hasPermission(accessControlState, caller, #user);

    let allComics = comics.values().toArray();

    // Filter explicit content for guests
    let filteredComics = if (not isLoggedIn) {
      allComics.filter(
        func(comic : Comic) : Bool {
          not comic.isExplicit;
        },
      );
    } else {
      allComics;
    };

    // Sort comics
    let sortedComics = if (sortBy == "updated") {
      filteredComics.sort(Comic.compareByUpdatedAt);
    } else if (sortBy == "popular") {
      filteredComics.sort(Comic.compareByViewCount);
    } else {
      filteredComics.sort(Comic.compareByTitle);
    };

    // Paginate
    let start = page * pageSize;
    let end = Nat.min(start + pageSize, sortedComics.size());

    if (start >= sortedComics.size()) {
      return [];
    };

    Array.tabulate<Comic>(
      end - start,
      func(i : Nat) : Comic {
        sortedComics[start + i];
      },
    );
  };

  // Public: Search comics (with explicit content filtering)
  public query ({ caller }) func searchComics(queryText : Text, genre : ?Text, status : ?Text) : async [Comic] {
    let isLoggedIn = AccessControl.hasPermission(accessControlState, caller, #user);
    let allComics = comics.values().toArray();

    // Filter explicit content for guests
    let filteredComics = if (not isLoggedIn) {
      allComics.filter(
        func(comic : Comic) : Bool {
          not comic.isExplicit;
        },
      );
    } else {
      allComics;
    };

    let normalizedQuery = normalizeTitle(queryText);

    filteredComics.filter<Comic>(
      func(comic : Comic) : Bool {
        let titleMatch = if (queryText.size() > 0) {
          normalizeTitle(comic.title).contains(#text normalizedQuery);
        } else {
          true;
        };

        let genreMatch = switch (genre) {
          case (null) { true };
          case (?g) {
            comic.genres.find<Text>(func(cg : Text) : Bool { cg == g }) != null;
          };
        };

        let statusMatch = switch (status) {
          case (null) { true };
          case (?s) { comic.status == s };
        };

        titleMatch and genreMatch and statusMatch;
      },
    );
  };

  // Admin-only: Import from MangaDex
  public shared ({ caller }) func importFromMangaDex(mangadexId : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can import from MangaDex");
    };

    // Placeholder for HTTP outcall implementation
    Runtime.trap("Not implemented: HTTP outcall to MangaDex API");
  };

  // Admin-only: Fetch MangaDex chapters
  public shared ({ caller }) func fetchMangaDexChapters(mangadexId : Text, comicId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can fetch MangaDex chapters");
    };

    // Placeholder for HTTP outcall implementation
    Runtime.trap("Not implemented: HTTP outcall to MangaDex API");
  };

  // Admin-only: Grab chapter pages
  public shared ({ caller }) func grabChapterPages(comicId : Nat, chapterId : Nat, urlTemplate : Text, pageStart : Nat, pageEnd : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can grab chapter pages");
    };

    // Placeholder for HTTP outcall implementation
    Runtime.trap("Not implemented: HTTP outcall for page grabbing");
  };
};
