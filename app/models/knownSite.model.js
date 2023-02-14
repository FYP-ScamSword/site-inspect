module.exports = (mongoose) => {
  const KnownSites = mongoose.model(
    "cybersquat_known_sites",
    mongoose.Schema({
      url: String,
      organization: String,
      keyword: String,
    })
  );

  return KnownSites;
};
