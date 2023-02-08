module.exports = (mongoose) => {
  const InspectedLink = mongoose.model(
    "inspected_links",
    mongoose.Schema(
      {
        processed_url: String,
        original_url: String,
        status: String,
        report: String,
        image: String,
        domain_age: Number,
        registrar_abuse_contact: String,
        toFlag: Boolean,
        registration_period: Number
      },
      { timestamps: true }
    )
  );

  return InspectedLink;
};
