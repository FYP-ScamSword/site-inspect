module.exports = (mongoose) => {
  const KeywordBlacklist = mongoose.model(
    "keyword_blacklist",
    mongoose.Schema({
      blacklist_keyword: String,
    }),
    "keyword_blacklist"
  );

  return KeywordBlacklist;
};
