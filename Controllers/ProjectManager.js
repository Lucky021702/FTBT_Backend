const PM_model = require("../models/Schema");
let jwt = require("jsonwebtoken");

//token
const generateToken = (id) => {
  let PM_ID = id.toString();
  let token = jwt.sign({ id: PM_ID }, "apoorv");
  return token;
};
const getPM = async (req, res) => {
  try {
    let { token } = req.params;
    let id = jwt.verify(token, "apoorv");
    let PMdetails = await PM_model.findOne({ _id: id }).select(
      "-password - __id - __v"
    );
    res.send(PMdetails); 
  } catch (error) {
    console.log("Error fetching PM details", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//login

const loginPM = async (req, res) => {
  try {
    const { userName, password, department } = req.body;
    const user = await PM_model.findOne({
      userName,
      department,
    });
    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }
    //password verify
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }
    //generate jwt
    const token = generateToken(user._id);
    res.status(200).json({ token });
  } catch (error) {
    console.log("error logging in:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
module.exports = { getPM, loginPM };
