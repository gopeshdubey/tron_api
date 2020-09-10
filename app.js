const cron = require("node-cron");
const express = require("express");
var bodyParser = require("body-parser");
var cors = require("cors");
const TronWeb = require("tronweb");
require("dotenv").config();

app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// GLOBAL VARIABLES
var contract_functions = null;

// INITIALISING THE TRONWEB
const tronWeb = new TronWeb({
  fullHost: "https://api.trongrid.io",
  privateKey: process.env.PRIVATE_KEY_MAINNET,
});

const link = "https://freelancer.cash";

app.get("/link/:referral_id", (req, res) => {
  var { referral_id } = req.params;
  res.json({
    code: 200,
    message: "success",
    result: link + "/?id=" + referral_id,
  });
});

app.listen(3080, async () => {
  console.log("Running on port ::::: 3080");
  try {
    contract_functions = await tronWeb
      .contract()
      .at(process.env.CONTRACT_ADDRESS);
  } catch (error) {
    console.log("ERROR IN TRON WEB :::::", error);
  }
});

// SCHEDULING THE TASK
cron.schedule("*/10 * * * *", async () => {
  console.log("running a task every 5 minute");
  try {
    var data_of_users_array = await contract_functions.getEntries().call();

    if (data_of_users_array.length > 0) {
      data_of_users_array.map(async (data) => {
        var addressInHex = await tronWeb.address.toHex(data);

        var data_of_struct = await contract_functions.players_address(addressInHex).call()

        var data_of_transfer_struct = await contract_functions.send_trx(data_of_struct.id.toNumber()).call()
        console.log('id ::::::', data_of_transfer_struct.id.toNumber());
        console.log('address ::::::', data_of_transfer_struct.user_address);
        console.log('amount ::::::', data_of_transfer_struct.amount_to_send.toNumber());

        if (data_of_transfer_struct.id.toNumber() != 0) {
          if (data_of_transfer_struct.amount_to_send.toNumber() != 0) {
            await tronWeb.trx.sendTransaction(
              accounts,
              amount,
              process.env.PRIVATE_KEY_MAINNET
            );
          }
        }
      });
    }
  } catch (error) {
    console.log("Error in schedular :::::", error);
  }
});
