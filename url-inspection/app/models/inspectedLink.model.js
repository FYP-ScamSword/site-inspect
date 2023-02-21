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
        to_flag: Boolean,
        num_flags: Number,
        registration_period: Number,
        dga_flag: Boolean,
        redirections_flag: Boolean,
        domain_age_flag: Boolean,
        registration_period_flag: Boolean,
        safe_browsing_flag: Boolean,
        web_risk_flag: Boolean,
        subdomain_len_flag: Boolean,
        blacklisted_keyword_flag: Boolean,
        homographsquatting_flag: Boolean,
        typobitsquatting_flag: Boolean,
        combolevelsquatting_flag: Boolean,
      },
      { timestamps: true }
    )
  );

  return InspectedLink;
};
