import Map "mo:core/Map";
import Set "mo:core/Set";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import List "mo:core/List";
import Array "mo:core/Array";
import Float "mo:core/Float";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Char "mo:core/Char";

import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import OutCall "http-outcalls/outcall";
import AccessControl "authorization/access-control";
import Migration "migration";

(with migration = Migration.run)
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
    createdAt : Int;
    updatedAt : Int;
    viewCount : Nat;
  };

  public type Chapter = {
    id : Nat;
    comicId : Nat;
    chapterNumber : Float;
    title : Text;
    createdAt : Int;
    mangadexChapterId : ?Text;
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
    createdAt : Int;
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

  // Helper function to check if an array has unique elements
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

  // Helper function to normalize titles
  func normalizeTitle(title : Text) : Text {
    title.trim(#char(' ')).toLower();
  };

  func containsText(set : Set.Set<Text>, text : Text) : Bool {
    set.values().any(
      func(t) { Text.equal(t, text) }
    );
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
    if (containsText(titles, normalized)) {
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
    if (normalized != normalizeTitle(existing.title) and containsText(titles, normalized)) {
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

  // Public: Increment view count (with explicit content check)
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
      mangadexChapterId = null;
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
  public shared ({ caller }) func addComment(comicId : Nat, username : Text, text : Text) : async () {
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
      username;
      text;
      createdAt = now;
    };
    comments.add(id, comment);
  };

  // Public: List comments (with explicit content check)
  public query ({ caller }) func listCommentsByComic(comicId : Nat) : async [Comment] {
    let comic = switch (comics.get(comicId)) {
      case (null) { Runtime.trap("Comic not found") };
      case (?comic) { comic };
    };

    // Check explicit content access - comments on explicit comics require login
    if (comic.isExplicit) {
      if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
        Runtime.trap("Unauthorized: Must be logged in to view comments on explicit content");
      };
    };

    let result = comments.values().toArray().filter(
      func(comment : Comment) : Bool {
        comment.comicId == comicId;
      },
    );
    result;
  };

  // Admin or owner: Delete comment
  public shared ({ caller }) func deleteComment(id : Nat) : async () {
    let comment = switch (comments.get(id)) {
      case (null) { Runtime.trap("Comment not found") };
      case (?comment) { comment };
    };

    // Allow admins or the comment owner to delete
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let isOwner = comment.userId == caller;

    if (not (isAdmin or isOwner)) {
      Runtime.trap("Unauthorized: Only admins or comment owners can delete comments");
    };

    comments.remove(id);
  };

  // Public: List all comics (with explicit content filtering)
  public query ({ caller }) func listComics(page : Nat, pageSize : Nat, sortBy : Text) : async [Comic] {
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
      filteredComics.sort(
        func(a, b) {
          Int.compare(b.updatedAt, a.updatedAt);
        }
      );
    } else if (sortBy == "popular") {
      filteredComics.sort(
        func(a, b) {
          Nat.compare(b.viewCount, a.viewCount);
        }
      );
    } else {
      filteredComics.sort(
        func(a, b) {
          Text.compare(a.title, b.title);
        }
      );
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

  // Public: List all genres
  public query func listAllGenres() : async [Text] {
    genres.toArray();
  };

  // HTTP transform function for outcalls
  public query func transform(raw : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    { raw.response with headers = [] };
  };

  // Helper function to split text and get the first occurrence after a separator
  func splitFirst(text : Text, sep : Text) : ?Text {
    let parts = text.split(#text sep);
    ignore parts.next(); // skip before-marker
    switch (parts.next()) {
      case (null) { null };
      case (?after) {
        switch (after.split(#text "\"").next()) {
          case (null) { null };
          case (?v) {
            if (v.size() > 0) { ?v } else { null };
          };
        };
      };
    };
  };

  // Admin-only: Import from MangaDex (full implementation)
  public shared ({ caller }) func importFromMangaDex(mangadexId : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can import from MangaDex");
    };

    // Step 1: HTTP call to MangaDex
    let url = "https://api.mangadex.org/manga/" # mangadexId # "?includes[]=cover_art";
    let json = await OutCall.httpGetRequest(url, [], transform);

    // Step 2: Extract title - try "en", then "ja-ro", then "ja"
    let rawTitle = switch (splitFirst(json, "\"en\":\"")) {
      case (?t) { t };
      case (null) {
        switch (splitFirst(json, "\"ja-ro\":\"")) {
          case (?t) { t };
          case (null) {
            switch (splitFirst(json, "\"ja\":\"")) {
              case (?t) { t };
              case (null) { "Unknown Title" };
            };
          };
        };
      };
    };

    // Truncate title to max 100 chars
    var titleChars = "";
    var charCount = 0;
    for (c in rawTitle.chars()) {
      if (charCount < 100) { titleChars #= Text.fromChar(c); charCount += 1; };
    };
    let titleFinal = titleChars;

    // Step 3: Extract status
    let rawStatus = switch (splitFirst(json, "\"status\":\"")) { case (?s) { s }; case (null) { "ongoing" } };
    let statusFinal = if (rawStatus == "completed") {
      "completed";
    } else if (rawStatus == "hiatus") {
      "hiatus";
    } else { "ongoing" };

    // Step 4: Extract synopsis from description.en
    let synopsisFinal = switch (splitFirst(json, "\"description\":{\"en\":\"")) {
      case (?d) { d };
      case (null) { "" };
    };

    // Step 5: Extract fileName for cover
    let coverFinal : ?Text = switch (splitFirst(json, "\"fileName\":\"")) {
      case (null) { null };
      case (?fn) {
        ?("https://uploads.mangadex.org/covers/" # mangadexId # "/" # fn);
      };
    };

    // Step 6: Extract genres from tag names
    let knownGenres = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller", "Isekai", "Martial Arts"];
    let genreSet = Set.empty<Text>();

    // Split json by "\"name\":{\"en\":\"" to find tag names
    let tagParts = json.split(#text "\"name\":{\"en\":\"");
    ignore tagParts.next(); // skip before first
    for (part in tagParts) {
      switch (part.split(#text "\"").next()) {
        case (null) {};
        case (?tagName) {
          for (kg in knownGenres.values()) {
            if (tagName.toLower() == kg.toLower()) {
              genreSet.add(kg);
            };
          };
        };
      };
    };
    let genresFinal = genreSet.toArray();

    // Step 7: Handle duplicate title
    let normalizedTitle = titleFinal.trim(#char(' ')).toLower();
    let uniqueTitle = if (containsText(titles, normalizedTitle)) {
      // Take first 8 chars of mangadexId
      var prefix = "";
      var pCount = 0;
      for (c in mangadexId.chars()) {
        if (pCount < 8) { prefix #= Text.fromChar(c); pCount += 1; };
      };
      titleFinal # " [" # prefix # "]";
    } else { titleFinal };

    // Step 8: Create comic
    comicIdCounter += 1;
    let newId = comicIdCounter;
    let now = Time.now();
    let comic : Comic = {
      id = newId;
      title = uniqueTitle;
      coverBlobId = coverFinal;
      genres = genresFinal;
      status = statusFinal;
      synopsis = synopsisFinal;
      sourceType = "mangadex";
      isExplicit = false;
      createdAt = now;
      updatedAt = now;
      viewCount = 0;
    };
    comics.add(newId, comic);
    titles.add(uniqueTitle.trim(#char(' ')).toLower());
    for (g in genresFinal.values()) { genres.add(g) };
    newId;
  };

  // Admin-only: Fetch MangaDex chapters (full implementation with UUID extraction)
  public shared ({ caller }) func fetchMangaDexChapters(mangadexId : Text, comicId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can fetch MangaDex chapters");
    };

    // Verify comic exists
    switch (comics.get(comicId)) {
      case (null) { Runtime.trap("Comic not found") };
      case (?_) {};
    };

    // HTTP GET request
    let url = "https://api.mangadex.org/manga/" # mangadexId # "/feed?translatedLanguage[]=id&translatedLanguage[]=en&order[chapter]=asc&limit=500&offset=0";
    let json = await OutCall.httpGetRequest(url, [], transform);

    // Extract chapter UUIDs by splitting on ",\"type\":\"chapter\""
    let chUuidList = List.empty<Text>();
    let typeParts = json.split(#text ",\"type\":\"chapter\"");
    ignore typeParts.next(); // skip first part (before any chapter)
    
    for (part in typeParts) {
      // Look backwards for the last "\"id\":\"" in this part
      let idParts = part.split(#text "\"id\":\"");
      var lastUuid : ?Text = null;
      for (idPart in idParts) {
        switch (idPart.split(#text "\"").next()) {
          case (null) {};
          case (?uuid) {
            if (uuid.size() > 0) {
              lastUuid := ?uuid;
            };
          };
        };
      };
      switch (lastUuid) {
        case (null) {};
        case (?uuid) { chUuidList.add(uuid) };
      };
    };
    let chUuids = chUuidList.toArray();

    // Extract chapter numbers
    let chNumList = List.empty<Text>();
    let chNumParts = json.split(#text "\"chapter\":\"");
    ignore chNumParts.next();
    for (part in chNumParts) {
      switch (part.split(#text "\"").next()) {
        case (null) {};
        case (?v) { chNumList.add(v) };
      };
    };
    let chNums = chNumList.toArray();

    // Extract chapter titles
    let chTitleList = List.empty<Text>();
    let chTitleParts = json.split(#text "\"title\":\"");
    ignore chTitleParts.next();
    for (part in chTitleParts) {
      switch (part.split(#text "\"").next()) {
        case (null) {};
        case (?v) { chTitleList.add(v) };
      };
    };
    let chTitles = chTitleList.toArray();

    // Collect existing chapter numbers for this comic
    let existingNums = Set.empty<Float>();
    for ((_, ch) in chapters.entries()) {
      if (ch.comicId == comicId) { existingNums.add(ch.chapterNumber) };
    };

    // Parse float helper
    func pf(s : Text) : Float {
      if (s.size() == 0) { return 0.0 };
      var intAcc : Nat = 0;
      var fracAcc : Nat = 0;
      var fracLen : Nat = 0;
      var seenDot = false;
      for (c in s.chars()) {
        let code = c.toNat32();
        if (code >= 48 and code <= 57) {
          let digit = (code - 48).toNat();
          if (seenDot) {
            fracAcc := fracAcc * 10 + digit;
            fracLen += 1;
          } else {
            intAcc := intAcc * 10 + digit;
          };
        } else if (c == '.') { seenDot := true };
      };
      var divisor : Float = 1.0;
      var i = 0;
      while (i < fracLen) {
        divisor *= 10.0;
        i += 1;
      };
      intAcc.toFloat() + fracAcc.toFloat() / divisor;
    };

    var seqNum : Float = 1.0;
    var idx = 0;
    for (numStr in chNums.values()) {
      let chNum = if (numStr.size() == 0) { seqNum } else { pf(numStr) };
      if (not existingNums.contains(chNum)) {
        existingNums.add(chNum);
        let chTitle = if (idx < chTitles.size()) { chTitles[idx] } else { "" };
        let chUuid = if (idx < chUuids.size()) { ?chUuids[idx] } else { null };
        
        chapterIdCounter += 1;
        let chId = chapterIdCounter;
        let now = Time.now();
        chapters.add(chId, { 
          id = chId; 
          comicId; 
          chapterNumber = chNum; 
          title = chTitle; 
          createdAt = now; 
          mangadexChapterId = chUuid 
        });
      };
      seqNum += 1.0;
      idx += 1;
    };
  };

  // Admin-only: Fetch MangaDex chapter pages (full implementation)
  public shared ({ caller }) func fetchMangaDexChapterPages(chapterId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can fetch MangaDex chapter pages");
    };

    let chapter = switch (chapters.get(chapterId)) {
      case (null) { Runtime.trap("Chapter not found") };
      case (?ch) { ch };
    };

    let mangadexChapterId = switch (chapter.mangadexChapterId) {
      case (null) { Runtime.trap("Chapter does not have a MangaDex ID") };
      case (?id) { id };
    };

    let url = "https://api.mangadex.org/at-home/server/" # mangadexChapterId;
    let json = await OutCall.httpGetRequest(url, [], transform);

    let baseUrl = switch (splitFirst(json, "\"baseUrl\":\"")) {
      case (null) { Runtime.trap("Base URL not found") };
      case (?url) { url };
    };

    let hash = switch (splitFirst(json, "\"hash\":\"")) {
      case (null) { Runtime.trap("Hash not found") };
      case (?h) { h };
    };

    let data = switch (splitFirst(json, "\"data\":[")) {
      case (null) { Runtime.trap("Data array not found") };
      case (?d) { d };
    };

    // Parse page filenames
    let filenames = List.empty<Text>();
    let items = data.split(#text "\"");
    ignore items.next();
    for (item in items) {
      switch (item.split(#text "\"").next()) {
        case (null) {};
        case (?filename) {
          if (filename.size() > 0) {
            filenames.add(filename);
          };
        };
      };
    };

    // Delete existing pages for this chapter
    let pagesToRemove = List.empty<Nat>();
    for ((pageId, p) in pages.entries()) {
      if (p.chapterId == chapterId) {
        pagesToRemove.add(pageId);
      };
    };

    for (pageId in pagesToRemove.values()) {
      pages.remove(pageId);
    };

    // Add new pages with constructed URLs
    var pageNumber = 1;
    for (filename in filenames.values()) {
      let blobId = baseUrl # "/data/" # hash # "/" # filename;
      pageIdCounter += 1;
      let pageId = pageIdCounter;

      let page = {
        id = pageId;
        chapterId;
        pageNumber;
        blobId;
      };
      pages.add(pageId, page);

      pageNumber += 1;
    };
  };

  // Admin-only: Grab chapter pages
  public shared ({ caller }) func grabChapterPages(comicId : Nat, chapterId : Nat, urlTemplate : Text, pageStart : Nat, pageEnd : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can grab chapter pages");
    };

    // Verify comic exists
    switch (comics.get(comicId)) {
      case (null) { Runtime.trap("Comic not found") };
      case (?_) {};
    };

    // Verify chapter exists and belongs to the comic
    let chapter = switch (chapters.get(chapterId)) {
      case (null) { Runtime.trap("Chapter not found") };
      case (?chapter) { chapter };
    };

    if (chapter.comicId != comicId) { Runtime.trap("Chapter does not belong to the specified comic") };

    // Store page URLs (no HTTP requests, just store the URL pattern)
    var pageNum = pageStart;
    while (pageNum <= pageEnd) {
      pageIdCounter += 1;
      let pageId = pageIdCounter;
      let blobId = if (urlTemplate.contains(#text("{page}"))) {
        urlTemplate.replace(#text("{page}"), pageNum.toText());
      } else {
        urlTemplate # pageNum.toText();
      };

      let page : Page = {
        id = pageId;
        chapterId;
        pageNumber = pageNum;
        blobId;
      };
      pages.add(pageId, page);

      pageNum += 1;
    };
  };
};
