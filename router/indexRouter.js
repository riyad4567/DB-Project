const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const router = express.Router({ mergeParams: true });
const DB_stats = require("../Database/DB-product");
const DB_user = require("../Database/DB-user");
const database = require("../Database/database");
const bcrypt = require("bcrypt");
const { response } = require("../app");
router.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  })
);
router.use(bodyParser.urlencoded({ extended: true }));
router.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://127.0.0.1:5501"); // Change to your client's origin
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
var seatbook = [];

router.post("/persontocheckbook", async (req, res) => {
  const result = await DB_user.personbookedticket(req.body.userId);

  if (result.rows.length == 0) res.send({ status: "ok" });
  else res.send({ status: "notok" });
});
router.post("/registration", async (req, res) => {

// const nid=req.body.NID;
// const response=await DB_user.nidcheck(nid);
// console.log("yes");
// if(response.rows.length==0)
// {


//   res.send({status:"notok"});

// }

// else
// {



  const hashpassword = await bcrypt.hash(req.body.PASSWORD, 10);
  const result = await DB_user.createNewRegester(req.body, hashpassword);
  console.log(result);

  res.send({ status: "ok" });

});

//this is for the use of the station informtion as well as for other query;
const setdata = {
  FROM: "",
  TO: "",
  DATE: "",
};
var TRAINNAME;

const userSelections = {};
const usercredentials = {};
const userseatbook = {};
const usertrainselection = {};

router.post("/accountinformation", async (req, res) => {
  const result = await DB_user.gettheaccountinformation(req.body.userId);

   res.send(result.rows);
});

router.post("/login", async (req, res) => {
  //console.log(req.session.user);
  const result = parseInt(req.body.Number);
  console.log(result);

  const user_reg = await DB_user.getpersondata();
  console.log(user_reg.rows);
  number = req.body.Number;
  var password = req.body.PASSWORD;
  //const userPassword = await bcrypt.hash(req.body.PASSWORD, 2);

  var tmp = 0;
  //console.log(user_reg.length);
  for (const row of user_reg.rows) {
    if (row.PHONE == number) {
      // Get this from user input
      const userPassword = password;
      console.log(userPassword);
      const storedHashedPassword = row.PASSWORD;
      // Retrieve from the database
      console.log(storedHashedPassword);

      const isvalid = await bcrypt.compare(userPassword, storedHashedPassword);
      if (isvalid) {
        tmp = 1;
      }

      //console.log(row.user_mobile_no);
      // console.log(row.PASSWORD);
    }
    //console.log(row.EMAIL, row.PASSWORD);
  }
  console.log("hello i am here");
  if (tmp == 1) {
    usercredentials[number] = {
      number,
      password,
    };
    req.session.number = number;

    res.send({ confirm_status: "yes" });
  } else {
    //document.getElementById("popup1").style.display = '';
    res.send({ confirm_status: "no" });
  }
});

router.post("/gettrainInformation", async (req, res) => {
  const FROM = req.body.FROM;
  const TO = req.body.TO;
  const DATE = req.body.DATE;
  setdata.FROM = FROM;
  setdata.TO = TO;
  setdata.DATE = DATE;
  //console.log(FROM,TO,DATE);
  userSelections[req.body.userId] = {
    FROM,
    TO,
    DATE,
  };
  const result = await DB_user.getdatefortrain(setdata);
  console.log(result);
  if (result.rows[0].TICKETCOUNT) {
    res.send({ ok: 1 });
  } else {
    res.send({ ok: 0 });
  }
});

router.post("/searchbusInformation", async (req, res) => {
  setdata.FROM = req.body.FROM;
  setdata.TO = req.body.TO;
  setdata.DATE = req.body.DATE;
  //console.log(FROM,TO,DATE);
  // const result=await DB_user.getdatefortrain(setdata);
  // console.log(result);
  // if(result.rows[0].TICKETCOUNT)
  // {
  //   res.send({ ok:1});
  // }
  // else
  //   {
  //     res.send({ok:0});
  //   }
  res.send({ ok: 1 });
});

router.post("/getbusInformation", async (req, res) => {
  setdata.FROM = req.body.FROM;
  setdata.TO = req.body.TO;
  setdata.DATE = req.body.DATE;
  //console.log(FROM,TO,DATE);
  // const result=await DB_user.getdatefortrain(setdata);
  // console.log(result);
  // if(result.rows[0].TICKETCOUNT)
  // {
  //   res.send({ ok:1});
  // }
  // else
  //   {
  //     res.send({ok:0});
  //   }
  console.log(setdata);
  const result = await DB_stats.getbus(setdata);

  const busData = result.rows.map((bus) => ({
    BUS_NAME: bus.BUS_NAME,
    BUS_ID: bus.BUS_ID,
  }));

  res.send(busData);
});

var BUS_ID, BUS_NAME;

router.get("/getdatabusrow", async (req, res) => {
  const result1 = await DB_user.getbustime(setdata, BUS_ID);
  const result2 = await DB_user.getfare(setdata, BUS_ID);
  console.log(result1, result2);
  //res.send({ok:1});

  res.send({
    FROM: setdata.FROM,
    TO: setdata.TO,
    FARE: result2.rows[0].FARE,
    START_TIME: result1.rows[0].START_TIME,
    FINISH_TIME: result1.rows[0].FINISH_TIME,
  });
});

router.get("/getseatconfigureofbus", async (req, res) => {
  //console.log(typeof(req.body.BUS_ID),req.body.BUS_NAME);
  console.log(BUS_ID, BUS_NAME);
  const result = await DB_user.getseatdatabus(setdata, BUS_ID, BUS_NAME);
  //var newvalue;
  const seatconfiguretypeone = new Array(10)
    .fill(0)
    .map(() => new Array(5).fill(0));
  const seatconfigurename = new Array(10)
    .fill(0)
    .map(() => new Array(5).fill(0));
  var k = result.rows[0].SEAT_ID;
  console.log(k);
  // Function to generate a 2D array of seat labels
  function generateSeatLabels(totalSeats, seatsPerRow) {
    const seatLabels = [];
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    let seatCount = 1;
    for (let row = 0; row < totalSeats / seatsPerRow; row++) {
      const rowLabel = alphabet.charAt(row);
      const rowSeats = [];

      for (let seat = 1; seat <= seatsPerRow; seat++) {
        const seatLabel = rowLabel + seat;
        rowSeats.push(seatLabel);
        seatCount++;
      }

      seatLabels.push(rowSeats);
    }

    return seatLabels;
  }

  const totalSeats = 50;
  const seatsPerRow = 5;
  const seatLabels2D = generateSeatLabels(totalSeats, seatsPerRow);

  //console.log(seatLabels2D); // This will log the 2D array of seat labels

  for (const row2 of result.rows) {
    const seatId = row2.SEAT_ID;
    const rowNumber = Math.floor((seatId - k) / 5);
    const seatIndex = (seatId - k) % 5;

    if (row2.STATUS === "B") {
      seatconfiguretypeone[rowNumber][seatIndex] = 1;
    } else if (row2.STAUS === "NA") {
      seatconfiguretypeone[rowNumber][seatIndex] = 2;
    }
    seatconfigurename[rowNumber][seatIndex] = row2.SEAT_ID;
  }

  console.log({ seatdata: seatconfiguretypeone });
  res.send({
    seatdata: seatconfiguretypeone,
    seatdata2: seatconfigurename,
    seatdata3: seatLabels2D,
  });
  //res.send({ topic: "yes send again" });
});

router.post("/nidname", async (req, res) => {
 const id=req.body.userid;
 const result = await DB_user.nidname(id);
  console.log(result);
  res.send(result.rows); 
});

router.post("/sendthebusid", async (req, res) => {
  BUS_ID = req.body.BUS_ID;
  BUS_NAME = req.body.BUS_NAME;

  res.send({ topic: "yes send again" });
});

router.post("/getsetthetrainagin", async (req, res) => {
  const FROM = req.body.FROM;
  const TO = req.body.TO;
  const DATE = req.body.DATE;
  const number = req.body.userId;
  setdata.FROM = FROM;
  setdata.TO = TO;
  setdata.DATE = DATE;
  //console.log(FROM,TO,DATE);
  //const result=await DB_user.getdatefortrain(setdata);
  res.send({ topic: "yes send again" });
});

router.get("/getstationinformation", async (req, res) => {
  const result = await DB_user.getstations();
  // console.log(result);

  const trainData = result.rows.map((station) => ({
    STATION_NAME: station.STATION_NAME,
  }));

  res.send(trainData);
});

router.post("/paymentdetails", async (req, res) => {
  const FROM = req.body.FROM;
  const TO = req.body.TO;
  const DATE = req.body.DATE;
  const number = req.body.userId;
  setdata.FROM = FROM;
  setdata.TO = TO;
  setdata.DATE = DATE;
  const result = await DB_user.getpaymentdetails(number);
  console.log(result);

  res.send({ result: result.rows, seatbooking: seatbook });

  //res.send(trainData);
});

router.post("/trainInformation", async (req, res) => {
  const FROM = req.body.FROM;
  const TO = req.body.TO;
  const DATE = req.body.DATE;
  const number = req.body.userId;
  setdata.FROM = FROM;
  setdata.TO = TO;
  setdata.DATE = DATE;
  const result = await DB_stats.getTrains(setdata);

  const trainData = result.rows.map((train) => ({
    TRAIN_NAME: train.TRAIN_NAME,
  }));

  res.send(trainData);
});
//need to change here later//////////////////////////////////////////////////////////////////////////
router.post("/ticketInformation", async (req, res) => {
  const FROM = req.body.FROM;
  const TO = req.body.TO;
  const DATE = req.body.DATE;
  const number = req.body.userId;
  console.log(FROM + TO + DATE + number);
  setdata.FROM = FROM;
  setdata.TO = TO;
  setdata.DATE = DATE;
  const result = await DB_user.getticketdata(req.body, setdata);
  //console.log(result);
  TRAINNAME = req.body.trainName;
  usertrainselection[req.body.userId] = {
    TRAINNAME,
  };

  res.send(result.rows);
});

router.post("/trainvisittimeshow", async (req, res) => {
  const FROM = req.body.FROM;
  const TO = req.body.TO;
  const DATE = req.body.DATE;
  const number = req.body.userId;
  setdata.FROM = FROM;
  setdata.TO = TO;
  setdata.DATE = DATE;

  let fromtime, totime, fromstation, tostation;
  const result = await DB_user.gettraindetailstimeshow(req.body, setdata);
  console.log(result);
  TRAINNAME = req.body.trainName;
  if (result.rows[0].STATIONI == setdata.FROM) {
    fromtime = result.rows[0].VISIT_TIME;
    fromstation = setdata.FROM;
    totime = result.rows[1].VISIT_TIME;
    tostation = setdata.TO;
  } else {
    fromtime = result.rows[1].VISIT_TIME;
    fromstation = setdata.FROM;
    totime = result.rows[0].VISIT_TIME;
    tostation = setdata.TO;
  }

  res.send({ fromstation, tostation, fromtime, totime });
});

router.post("/seatbooking", async (req, res) => {
  // console.log("before ticketinformation");
  //console.log(req.body);
  const FROM = req.body.FROM;
  const TO = req.body.TO;
  const DATE = req.body.DATE;
  const number = req.body.userId;
  setdata.FROM = FROM;
  setdata.TO = TO;
  setdata.DATE = DATE;

  const result = await DB_user.getsetpaymentdata(req.body, setdata);
  //await DB_user. updatetheseat(req.body, setdata);

  //console.log(result.rows);
  res.send(result);
});

router.post("/traindetails", async (req, res) => {
  // console.log("before ticketinformation");
  //console.log(req.body);
  const FROM = req.body.FROM;
  const TO = req.body.TO;
  const DATE = req.body.DATE;
  const number = req.body.userId;
  setdata.FROM = FROM;
  setdata.TO = TO;
  setdata.DATE = DATE;

  const result = await DB_user.gettraindetails(req.body, setdata);
  //console.log(result);
  res.send(result.rows);
});
router.get("/getdifferenttraindetails", async (req, res) => {
  // console.log("before ticketinformation");
  //console.log(req.body);

  const result = await DB_user.getdifferenttraindetails();
  console.log(result);
  res.send(result.rows);
});

router.post("/trainextradetails", async (req, res) => {
  // console.log("before ticketinformation");
  //console.log(req.body);
  console.log(req.body.trainName, req.body.UPDOWN);

  const result3 = await DB_user.fromtogetogtrain(
    req.body.trainName,
    req.body.UPDOWN
  );
  console.log(result3);
  const result = await DB_user.getvisitdataagain(
    req.body.trainName,
    result3.rows[0].FROM_STATION,
    result3.rows[0].TO_STATION
  );
  console.log(result);
  res.send(result.rows);
});

router.post("/coachInformation", async (req, res) => {
  // console.log("before ticketinformation");
  const FROM = req.body.FROM;
  const TO = req.body.TO;
  const DATE = req.body.DATE;
  const number = req.body.userId;
  setdata.FROM = FROM;
  setdata.TO = TO;
  setdata.DATE = DATE;
  const resultcoach = await DB_user.getCOACHdata(req.body, setdata);
  //console.log(result);

  var newvalue = [];
  //  console.log(resultcoach);

  for (const row of resultcoach.rows) {
    const result = await DB_user.getSEATallinformation(
      {
        trainName: TRAINNAME,
        Class: req.body.CLASS,
        COACH_NAME: row.COACH_NAME,
      },
      setdata
    );
    // console.log(result);

    const seatconfiguretypeone = new Array(10)
      .fill(0)
      .map(() => new Array(4).fill(0));
    const seatconfigurename = new Array(10)
      .fill("")
      .map(() => new Array(4).fill(""));
    var k = result.rows[0].SEAT_ID;
    console.log(k);
    for (const row2 of result.rows) {
      const seatId = row2.SEAT_ID;
      // console.log(seatId);
      const rowNumber = Math.floor((seatId - k) / 4);
      const seatIndex = (seatId - k) % 4;

      if (row2.STATUS === "B") {
        seatconfiguretypeone[rowNumber][seatIndex] = 1;
      } else if (row2.STATUS === "NA") {
        seatconfiguretypeone[rowNumber][seatIndex] = 2;
      }
      seatconfigurename[rowNumber][seatIndex] = row2.SEAT_NAME;
    }
    newvalue.push({
      COACH_NAME: row.COACH_NAME,
      seats: seatconfiguretypeone,
      seats2: seatconfigurename,
    });
    console.log(seatconfiguretypeone);
  }
  //res.redirect("/");
  // console.log(newvalue);
  res.send(newvalue);
});

router.post("/gettheconfirmation", async (req, res) => {
  const FROM = req.body.FROM;
  const TO = req.body.TO;
  const DATE = req.body.DATE;
  const number = req.body.userId;

  setdata.FROM = FROM;
  setdata.TO = TO;
  setdata.DATE = DATE;
  seatbook = req.body.seatbook;
  // console.log("before ticketinformation");
  console.log(setdata.FROM);
  const randomNumber = Math.floor(Math.random() * 9000) + 1000;

  // Create a unique purchase ID by combining a timestamp and the random number
  const purchaseId = `440${Date.now()}${randomNumber}`;
  //console.log(typeof(purchaseId));
  if (req.body.status === "yes") {
    seatbook.forEach(async (element) => {
      const result = await DB_user.updatetheseat(
        setdata,
        element.trainName,
        element.seatId
      );
      const result2 = await DB_user.updatethefinalticketseat(
        result.rows[0].TICKETID
      );
      //  console.log(typeof(req.body.userId));
      console.log(req.body.DATE);
      console.log(req.body.FROM);
      console.log(element.fareInput);
     
     
      const result3 = await DB_user.purchasetableinsert(
        req.body.userId,
        result.rows[0].TICKETID,
        element.Class,
        element.seatId,
        element.trainName,
        purchaseId,
        DATE,
        FROM,
        TO,
        element.fareInput

      );
      

      //console.log(result, result2);
    });
  }
  //const result = await DB_user.deletethebookedseat();

  res.send({ bookingstatus: "yes" });
});



router.post("/getalltheticketinformation", async (req, res) => {
  const purchaseid = req.body.purchaseid;
  const userid = req.body.userid;
  console.log(purchaseid);
  const result = await DB_user.getallthedataofpurchase(purchaseid, userid);
  console.log(result.rows);
  res.send(result.rows);
});

router.post("/fromtotime", async (req, res) => {
  const f = req.body.from;
  const t = req.body.to;
  const train=req.body.trainname;

  
  const result = await DB_user.fromtotime(f, t,train);
  console.log(f,t);
  console.log(result.rows);
  res.send(result.rows);
});




router.post("/ticketverification", async (req, res) => {
  const purchaseid = req.body.purchaseid;
  const mobile = req.body.mobile;
  console.log(purchaseid);
  const result = await DB_user.verifiedticketdata(purchaseid, mobile);
  console.log(result.rows);
  res.send(result.rows);
});

router.post("/purchasehistory", async (req, res) => {
  const FROM = req.body.FROM;
  const TO = req.body.TO;
  const DATE = req.body.DATE;
  const number = req.body.userId;
  setdata.FROM = FROM;
  setdata.TO = TO;
  setdata.DATE = DATE;
  seatbook = req.body.seatbook;
  const result = await DB_user.purchasehistory(number);
  console.log(result.rows);
  res.send(result.rows);
});
//there will be an url_action
router.post("/finalending", async (req, res) => {
  //console.log("yes");
  const FROM = req.body.FROM;
  const TO = req.body.TO;
  const DATE = req.body.DATE;
  const number = req.body.userId;
  setdata.FROM = FROM;
  setdata.TO = TO;
  setdata.DATE = DATE;
  seatbook = req.body.seatbook;

  if (req.body.bookingstatus == "no") {
    seatbook.forEach(async (element) => {
      const result = await DB_user.updatetheseat(
        setdata,
        element.trainName,
        element.seatId
      );
      const result2 = await DB_user.updatetheticketseat(
        result.rows[0].TICKETID
      );
      //console.log(result, result2);
    });
  }
  const result = await DB_user.deletethebookedseat(req.body.userId);
});
///query change
router.post("/checkforbookedticket", async (req, res) => {
  const FROM = req.body.FROM;
  const TO = req.body.TO;
  const DATE = req.body.DATE;
  const number = req.body.userId;
  setdata.FROM = FROM;
  setdata.TO = TO;
  setdata.DATE = DATE;
  // console.log("before ticketinformation");
  const result2 = await DB_user.updatetheseat(
    setdata,
    req.body.trainName,
    req.body.seatId
  );
  const result = await DB_user.alreadybookedseat(result2.rows[0].TICKETID);
  console.log(result);
  console.log("yes");
  if (result.rows.length == 0) {
    res.send({ status: "ok" });
  } else {
    res.send({ status: "notok" });
  }
});
////query change
router.post("/paymentproceed", async (req, res) => {
  // console.log("before ticketinformation");
  console.log(req.body);
  const FROM = req.body.FROM;
  const TO = req.body.TO;
  const DATE = req.body.DATE;
  const number = req.body.userId;
  setdata.FROM = FROM;
  setdata.TO = TO;
  setdata.DATE = DATE;

  seatbook = req.body.seatbook;
  userseatbook[req.body.userId] = {
    seatbook,
  };
  //console.log(typeof seatbook);
  seatbook.forEach(async (element) => {
    const result = await DB_user.updatetheseat(
      setdata,
      element.trainName,
      element.seatId
    );
    const result2 = await DB_user.updatetheticketseat(result.rows[0].TICKETID);
    const result3 = await DB_user.insertintobookedticket(
      number,
      result.rows[0].TICKETID
    );
    //console.log(result, result2);
  });

  //const timer = setTimeout(performAction, 1 * 60 * 1000);

  //const result = await DB_user.gettraindetails(req.body, setdata);
  //console.log(result);

  res.send({ riad: "yes" });
});

router.post("/paymentproceedforbus", async (req, res) => {
  const FROM = req.body.FROM;
  const TO = req.body.TO;
  const DATE = req.body.DATE;
  const number = req.body.userId;
  setdata.FROM = FROM;
  setdata.TO = TO;
  setdata.DATE = DATE;
  const seatbookforbus = req.body.seatbook;
  seatbookforbus.forEach(async (element) => {
    const result = await DB_user.getticketofthebus(setdata, element.seatId);
    const result2 = await DB_user.updatetheticketseatofbus(
      result.rows[0].TICKET_ID
    );
    //console.log(result, result2);
  });
  res.send({ riad: "ok" });
});

// router.post("/seatInformation", async (req, res) => {
//   // console.log("before ticketinformation");

//   // const result = await DB_user.getticketdata(req.body);
//   //res.senconsole.d(result.rows);

//   console.log(req.body);
//   const result = await DB_user.getSEATallinformation(req.body, setdata);
//   const seatconfiguretypeone = new Array(10)
//     .fill(0)
//     .map(() => new Array(4).fill(0));
//   var k = result.rows[0].SEAT_ID;
//   console.log(k);
//   for (const row of result.rows) {
//     const seatId = row.SEAT_ID;
//     const rowNumber = Math.floor((seatId - k) / 4);
//     const seatIndex = (seatId - k) % 4;

//     if (row.STATUS === "B") {
//       seatconfiguretypeone[rowNumber][seatIndex] = 1;
//     }
//   }
//   console.log(seatconfiguretypeone);

//   //console.log(result);
//   //console.log(result);
//   //res.render('index',{seats:seatconfiguretypeone});

//   //res.send({ name: "riad" });

//   res.send({ seats: seatconfiguretypeone });

module.exports = router;
