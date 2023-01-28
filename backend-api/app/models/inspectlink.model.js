module.exports = (mongoose) => {
  const InspectLink = mongoose.model(
    "inspected_links",
    mongoose.Schema(
      {
        processed_url: String,
        original_url: String,
        status: String,
        report: String,
        image: String,
        domain_age: Number,
        flag_points: Number,
        registrar_abuse_contact: String
      },
      { timestamps: true }
    )
  );

  return InspectLink;
};
