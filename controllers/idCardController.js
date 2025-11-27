exports.showIdCard = async (req, res) => {
  try {
    const user = req.session.user;

    if (!user) {
      return res.status(401).send("You are not logged in.");
    }

    // Ensure roles is always an array
    const safeUser = {
      id: user.id,
      name: user.name || "",
      mobile: user.mobile || "",
      roles: Array.isArray(user.roles) ? user.roles : [user.roles || "Member"],
      prant: user.prant || "",
      zila: user.zila || "",
      roleLevel: user.roleLevel || ""
    };

    res.render("idCard/show", { user: safeUser });

  } catch (err) {
    console.log("ID CARD ERROR:", err);
    res.status(500).send("Error generating ID Card");
  }
};
