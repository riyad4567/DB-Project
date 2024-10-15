const database = require("./database");

async function gettraindetails(train, setdata) {
  console.log(train);
  const sql = `SELECT V.VISIT_TIME,(SELECT S.STATION_NAME FROM STATION S WHERE V.STATION_ID=S.STATION_ID) AS INTERVAL_STATION
FROM VISITS V
WHERE (
	CONVERT_TIME2(getstarttime(:train_name,convert_time4(:f,:t,:train_name)),getfinishtime(:train_name,convert_time4(:f,:t,:train_name)),V.VISIT_TIME)='TRUE'
  
) AND TRAIN_ID =(SELECT TRAIN_ID FROM TRAIN WHERE TRAIN_NAME=:train_name)

`;
  const binds = {
    train_name: train.trainName,
    f: setdata.FROM,
    t: setdata.TO,
   // d:setdata.DATE
  };

  return await database.execute(sql, binds, database.options);
}


async function getvisitdataagain(train, from,to) {
  console.log(train);
  const sql = `SELECT V.VISIT_TIME,(SELECT S.STATION_NAME FROM STATION S WHERE V.STATION_ID=S.STATION_ID) AS INTERVAL_STATION
FROM VISITS V
WHERE (
	CONVERT_TIME2(getstarttime(:train_name,convert_time4(:f,:t,:train_name)),getfinishtime(:train_name,convert_time4(:f,:t,:train_name)),V.VISIT_TIME)='TRUE'
  
) AND TRAIN_ID =(SELECT TRAIN_ID FROM TRAIN WHERE TRAIN_NAME=:train_name)

`;
  const binds = {
    train_name: train,
    f: from,
    t: to,
   // d:setdata.DATE
  };

  return await database.execute(sql, binds, database.options);
}
async function gettraindetailstimeshow(train, setdata) {
  //console.log(train);
  const sql = `SELECT TEMP.VISIT_TIME,TEMP.STATIONI
  FROM
  (SELECT V.VISIT_TIME,(SELECT S.STATION_NAME FROM STATION S WHERE V.STATION_ID=S.STATION_ID) STATIONI
  FROM VISITS V
  WHERE (
    CONVERT_TIME2(getstarttime(:train_name,convert_time4(:f,:t,:train_name)),getfinishtime(:train_name,convert_time4(:f,:t,:train_name)),V.VISIT_TIME)='TRUE'
) AND TRAIN_ID =(SELECT TRAIN_ID FROM TRAIN WHERE TRAIN_NAME=:train_name)) temp
  WHERE STAtIONI=:f OR StationI=:t
`;
  const binds = {
    train_name: train.trainName,
    f: setdata.FROM,
    t: setdata.TO,
   // d:setdata.DATE
  };

  return await database.execute(sql, binds, database.options);
}

async function getticketdata(train, setdata) {
  console.log(train);
  const sql = ` SELECT T.CLASS,T.FARE,COUNT(DISTINCT t.TICKETID) AS SEAT_NUMBER
  FROM TICKET t JOIN SEATPOSSESTICKET s 
  ON (t.TICKETID=s.TICKET_ID)
  WHERE s.STATUS !='B' AND T.JOURNEYDATE =:d AND TIME_SLOT=(SELECT START_TIME FROM TIMETABLE WHERE FROM_STATION=convert_time4(:f,:t,:train_name) and TRAIN_ID=(SELECT TRAIN_ID FROM TRAIN WHERE TRAIN_NAME=:train_name)) AND CAST(FLOOR( SEAT_ID/10000) AS INT)=(SELECT TRAIN_ID FROM TRAIN WHERE TRAIN_NAME=:train_name) AND S.SEAT_ID IN
  (SELECT SEAT_ID
  FROM SEAT WHERE CAST(FLOOR( SEAT_ID/10000) AS INT) IN (
  
  
    (SELECT V.TRAIN_ID 
       
    FROM VISITS V
    JOIN STATION S ON V.STATION_ID = S.STATION_ID
    WHERE S.STATION_NAME =:f
  
  INTERSECT 
  
    SELECT V.TRAIN_ID 
          
    FROM VISITS V
    JOIN STATION S ON V.STATION_ID = S.STATION_ID
    WHERE S.STATION_NAME = :t
  )
  )
  
  )
  GROUP BY T.CLASS,T.FARE
`;
  const binds = {
    train_name: train.trainName,
    f: setdata.FROM,
    t: setdata.TO,
    d: setdata.DATE,
  };

  return await database.execute(sql, binds, database.options);
}
async function getpersondata() {
  const sql = `select PHONE,EMAIL,PASSWORD FROM PERSON`;
  const binds = {};
  return await database.execute(sql, binds, database.options);
}
async function getCOACHdata(seatdata, setdata) {
  const sql = `SELECT COACH_NAME FROM SEAT WHERE SEAT_ID IN(

      (SELECT SEAT_ID FROM SEATPOSSESTICKET R WHERE TICKET_ID IN(
      
      
      SELECT p.TICKETID 
      FROM TICKET p WHERE TICKETID  in
      (SELECT TICKETID  
      FROM TICKET t 
      WHERE JOURNEYDATE=:d AND t.CLASS =:classname
      INTERSECT
      SELECT TICKET_ID
      FROM SEATPOSSESTICKET s
      WHERE  s.STATUS='A' AND s.Time_Slot IN (
      SELECT VISIT_TIME FROM VISITS WHERE TRAIN_ID=(SELECT TRAIN_ID FROM TRAIN WHERE TRAIN_NAME=:trainname)AND STATION_ID=(SELECT STATION_ID FROM STATION WHERE STATION_NAME=convert_time4(:f,:t,:trainname))))
      )))
      GROUP BY COACH_NAME`;
  const binds = {
    classname: seatdata.Class,
    trainname: seatdata.trainName,
    f: setdata.FROM,
    d: setdata.DATE,
    t:setdata.TO,
  };
  return await database.execute(sql, binds, database.options);
}
async function getSEATdataAvailable(details, setdata) {
  //console.log(details);
  const sql = `SELECT S.SEAT_ID,S.SEAT_NAME FROM 


  (SELECT SEAT_ID FROM SEATPOSSESTICKET R WHERE TICKET_ID IN(
   SELECT p.TICKETID 
  FROM TICKET p WHERE TICKETID  in
  (SELECT TICKETID  
  FROM TICKET t 
  WHERE JOURNEYDATE=:d AND t.CLASS =:Class
  INTERSECT
  SELECT TICKET_ID
  FROM SEATPOSSESTICKET s
  WHERE  s.STATUS='A' AND s.Time_Slot IN (
  SELECT VISIT_TIME FROM VISITS WHERE TRAIN_ID=(SELECT TRAIN_ID FROM TRAIN WHERE TRAIN_NAME=:trainName)AND STATION_ID=(SELECT STATION_ID FROM STATION WHERE STATION_NAME=convert_time4(:f,:t,:trainName))))
  )) Q JOIN SEAT S ON(Q.SEAT_ID=S.SEAT_ID AND S.COACH_NAME=:COACH_NAME)
  `;
  const binds = {
    trainName: details.trainName,
    Class: details.Class,
    COACH_NAME: details.COACH_NAME,
    f: setdata.FROM,
    d: setdata.DATE,
    t:setdata.TO,
  };

  return await database.execute(sql, binds, database.options);
}

async function getseatdatabus(setdata,BUS_ID,BUS_NAME)
{
  console.log(typeof(BUS_ID));
  const sql=`SELECT R.SEAT_ID,(SELECT tc.STATUS FROM SEATBUSTICKET tc WHERE tc.TICKET_ID=R.TICKET_ID ) AS STATUS FROM SEATBUSTICKET R WHERE R.TICKET_ID in(

    SELECT B.TICKET_ID
    FROM BUSTICKET B JOIN SEATBUSTICKET s ON(B.TICKET_ID=S.TICKET_ID)
    WHERE B.JOURNEY_DATE=:d AND S.SEAT_ID  IN
    
    (SELECT b3.SEAT_ID 
    FROM BUSCONTAINSEAT b3
    WHERE b3.BUS_ID=:busid)
    )
    
  `
  const binds={
    busid:BUS_ID,
  d:setdata.DATE

  }
return await database.execute(sql, binds, database.options);
}
async function getbustime(setdata,BUS_ID)
{
  console.log(typeof(BUS_ID));
  const sql=`SELECT start_time,finish_time FROM bus WHERE BUS_ID =:id
    
  `
  const binds={
    id:BUS_ID,
  

  }
return await database.execute(sql, binds, database.options);
}




async function getdatefortrain(setdata)
{
  const sql=`SELECT COUNT(*) AS TICKETCOUNT
  from TICKET WHERE JOURNEYDATE=:d
  `
  const binds={
    d:setdata.DATE,

  }
return await database.execute(sql, binds, database.options);
}
async function getSEATdataBooked(details, setdata) {
  //console.log(details);
  const sql = `SELECT S.SEAT_ID,S.SEAT_NAME FROM 


  (SELECT SEAT_ID FROM SEATPOSSESTICKET R WHERE TICKET_ID IN(
   SELECT p.TICKETID 
  FROM TICKET p WHERE TICKETID  in
  (SELECT TICKETID  
  FROM TICKET t 
  WHERE JOURNEYDATE=:d AND t.CLASS =:Class
  INTERSECT
  SELECT TICKET_ID
  FROM SEATPOSSESTICKET s
  WHERE  s.STATUS='B' AND s.Time_Slot IN (
  SELECT VISIT_TIME FROM VISITS WHERE TRAIN_ID=(SELECT TRAIN_ID FROM TRAIN WHERE TRAIN_NAME=:trainName)AND STATION_ID=(SELECT STATION_ID FROM STATION WHERE STATION_NAME=convert_time4(:f,:t,:trainName))))
  )) Q JOIN SEAT S ON(Q.SEAT_ID=S.SEAT_ID AND S.COACH_NAME=:COACH_NAME)
  `;
  const binds = {
    trainName: details.trainName,
    Class: details.Class,
    COACH_NAME: details.COACH_NAME,
    f: setdata.FROM,
    d: setdata.DATE,
    t:setdata.TO,
  };

  return await database.execute(sql, binds, database.options);
}

async function getsetpaymentdata(details,setdata)
{
  const sql=`
  SELECT FARE 
FROM TICKET t 
WHERE TICKETID =(SELECT TICKETID 
FROM TICKET WHERE JOURNEYDATE=:d AND TICKETID IN
(
  SELECT TICKET_ID 
  FROM SEATPOSSESTICKET s 
  WHERE TIME_SLOT=(SELECT START_TIME FROM TIMETABLE WHERE TRAIN_ID=(SELECT TRAIN_ID FROM TRAIN WHERE TRAIN_NAME=:train_name) AND FROM_STATION=convert_time4(:f,:t,:train_name))    AND SEAT_ID IN(SELECT SEAT_ID FROM SEAT WHERE SEAT_NAME=:s AND CAST(FLOOR(SEAT_ID/10000) AS INT)=(SELECT TRAIN_ID FROM TRAIN WHERE TRAIN_NAME=:train_name)
  
)
)

)
  `
  const binds = {
    train_name: details.trainName,
   // Class: details.Class,
   // COACH_NAME: details.COACH_NAME,
   s:details.seatId,
    f: setdata.FROM,
    d: setdata.DATE,
    t:setdata.TO,
  };

  return await database.execute(sql, binds, database.options);


}

async function getSEATallinformation(details, setdata) {
  //console.log(details);
  const sql = `SELECT R.SEAT_ID,K.SEAT_NAME,(SELECT tc.STATUS FROM SEATPOSSESTICKET  tc WHERE tc.TICKET_ID=R.TICKET_ID ) AS STATUS FROM SEATPOSSESTICKET R,SEAT K WHERE K.SEAT_ID =R.SEAT_ID AND k.COACH_NAME =:COACH_NAME AND R.TICKET_ID IN(
    SELECT p.TICKETID 
    FROM TICKET p WHERE TICKETID  in
    (SELECT TICKETID  
    FROM TICKET t 
    WHERE JOURNEYDATE=:d 
    INTERSECT
    SELECT TICKET_ID
    FROM SEATPOSSESTICKET s
    WHERE s.Time_Slot IN (
    SELECT VISIT_TIME FROM VISITS WHERE TRAIN_ID=(SELECT TRAIN_ID FROM TRAIN WHERE TRAIN_NAME=:trainName)AND STATION_ID=(SELECT STATION_ID FROM STATION WHERE STATION_NAME=convert_time4(:f,:t,:trainName))))
    )
  `;
  const binds = {
    trainName: details.trainName,
    //Class: details.Class,
    COACH_NAME: details.COACH_NAME,
    f: setdata.FROM,
    d: setdata.DATE,
    t:setdata.TO,
  };

  return await database.execute(sql, binds, database.options);
}
async function getpaymentdetails(number) {
 // console.log(user);
  const sql = `
  SELECT P.EMAIL,N.NAME,P.PHONE FROM
person p JOIN NID n on(n.nid=p.nid)
WHERE p.PHONE =:p
    `;
  const binds = {
    p:number
  };
  return await database.execute(sql, binds, database.options);
}
async function getstations() {
  // console.log(user);
   const sql = `
   SELECT * FROM STATION
    `;
   const binds = {
   };
   return await database.execute(sql, binds, database.options);
 }


 async function getfare(setdata,BUS_ID) {
  // console.log(user);
   const sql = `
   SELECT  DISTINCT FARE
FROM BUSTICKET  WHERE TICKET_ID IN(

SELECT B.TICKET_ID
FROM BUSTICKET B JOIN SEATBUSTICKET s ON(B.TICKET_ID=S.TICKET_ID)
WHERE B.JOURNEY_DATE=:d AND S.SEAT_ID  IN

(SELECT b3.SEAT_ID 
FROM BUSCONTAINSEAT b3
WHERE b3.BUS_ID=:id)
)
    `;
   const binds = {
    d:setdata.DATE,
    id:BUS_ID
   };
   return await database.execute(sql, binds, database.options);
 }

async function createNewRegester(user,hashpassword) {
  console.log(user);
  const sql = `
  INSERT INTO PERSON
	( email,phone,nid,password) 
	VALUES 
	(:email,:phone,:nid,:password)
    `;
  const binds = {
    nid: user.NID,
   
    password: hashpassword,
    email: user.EMAIL,
    phone: user.PHONE,
  };
  return await database.execute(sql, binds, {});
}
async function updatetheseat(setdata,train,seatid) {
  //console.log(user);
  const sql = ` SELECT TICKETID
  FROM TICKET WHERE JOURNEYDATE=:d AND TICKETID IN
  (
    SELECT TICKET_ID 
    FROM SEATPOSSESTICKET s 
    WHERE TIME_SLOT=(SELECT START_TIME FROM TIMETABLE WHERE TRAIN_ID=(SELECT TRAIN_ID FROM TRAIN WHERE TRAIN_NAME=:trainname) AND FROM_STATION=convert_time4(:f,:t,:trainname) )    AND SEAT_ID IN(SELECT SEAT_ID FROM SEAT WHERE SEAT_NAME=:seatid AND CAST(FLOOR(SEAT_ID/10000) AS INT)=(SELECT TRAIN_ID FROM TRAIN WHERE TRAIN_NAME=:trainname)
    
  )
  )
  
  
 `;
 const binds = {
  trainname: train,
 // Class: details.Class,
 // COACH_NAME: details.COACH_NAME,
 seatid:seatid,
  f: setdata.FROM,
  d: setdata.DATE,
  t:setdata.TO,
};

return await database.execute(sql, binds, database.options);

}
async function updatetheticketseat(TICKET)
{
  const sql = ` UPDATE SEATPOSSESTICKET 
  SET STATUS='A'
  WHERE TICKET_ID=:id
  
  
  
 `;
 const binds = {
  id:TICKET
};
console.log(await database.execute(sql, binds, database.options));
return;


}
async function updatethefinalticketseat(TICKET)
{
  const sql = ` UPDATE SEATPOSSESTICKET 
  SET STATUS='B'
  WHERE TICKET_ID=:id
  `;
 const binds = {
  id:TICKET
};
console.log(await database.execute(sql, binds, database.options));
return;


}
async function  deletethebookedseat(userID)
{
  const sql = ` DELETE FROM BOOKEDTICKET where PERSONID=:i
  `;
 const binds = {
  i:userID,
 };
console.log(await database.execute(sql, binds, database.options));
return;


}
async function  alreadybookedseat(ticketid)
{
  const sql = `SELECT * FROM BOOKEDTICKET WHERE TICKET_ID=:t
  `;
 const binds = {
  t:ticketid,
 };
return await database.execute(sql, binds, database.options);



}
async function personbookedticket(userid)
{

  const sql = `SELECT * FROM BOOKEDTICKET WHERE PERSONID=:i
  `;
 const binds = {
  i:userid,
 };
return await database.execute(sql, binds, database.options);


}


async function getticketofthebus(setdata,seatid)
{

  const sql = `SELECT TICKET_ID FROM BUSTICKET WHERE JOURNEY_DATE=:d
  AND TICKET_ID IN(
  SELECT TICKET_ID  FROM SEATBUSTICKET WHERE SEAT_ID=:s
)
  `;
 const binds = {
  d:setdata.DATE,
  s:seatid,
 };
return await database.execute(sql, binds, database.options);


}
async function updatetheticketseatofbus (ticketid)
{
  const sql =`UPDATE SEATBUSTICKET SET STATUS='B' WHERE TICKET_ID=:t`
  const binds = {
    t:ticketid,
  };
  return await database.execute(sql, binds, database.options);
}
async function insertintobookedticket (number,ticketid)
{
  const sql =`INSERT INTO BOOKEDTICKET VALUES(:t,:n)`
  const binds = {
    t:ticketid,
    n:number,
  };
  return await database.execute(sql, binds, database.options);
}



async function purchasetableinsert (number,ticketid,Class,seat,train,purchaseId,d,f,to,fare)
{
//onsole.log(d,to,s);
  const sql =`INSERT INTO PURCHASE VALUES(:k,SYSDATE,:n,:t,:c,:s,:train,:d,:fromstation,:tostation,:fare)`
  const binds = {
    t:ticketid,
    k:purchaseId,
    n:number,
    s:seat,
    c:Class,
    train:train,
    d:d,
    fromstation:f,
    tostation:to,
    fare:fare,
    
  };
  return await database.execute(sql, binds, database.options);
}
async function purchasehistory(userid)
{

  const sql = `SELECT * FROM PURCHASE WHERE PHONE=:i order by PURCHASEID
  `;
 const binds = {
  i:userid,
 };
return await database.execute(sql, binds, database.options);


}
async function  getdifferenttraindetails()
{

  const sql = `SELECT (SELECT TRAIN_NAME FROM TRAIN R WHERE R.TRAIN_ID=T.TRAIN_ID)||'-('||T.UPDOWN||')' AS TRAIN_NAME FROM TIMETABLE T
  
  `;
 const binds = {
 
 };
return await database.execute(sql, binds, database.options);


}
async function  fromtogetogtrain(trianname,updown)
{

  const sql = `SELECT FROM_STATION,TO_STATION FROM TIMETABLE T WHERE TRAIN_ID=(SELECT TRAIN_ID FROM TRAIN WHERE TRAIN_NAME=:T) AND UPDOWN=:U
  
  `;
 const binds = {
  T:trianname,
  U:updown,
 
 };
return await database.execute(sql, binds, database.options);


}
async function  verifiedticketdata(purchaseid,mobile)
{

  const sql = `SELECT * from PURCHaSE WHERE PURCHASEID=:P AND phone=:m
  
  `;
 const binds = {
 p:purchaseid,
 m:mobile,

 
 };
return await database.execute(sql, binds, database.options);


}
async function  getallthedataofpurchase(purchaseid,mobile)
{

  const sql = `SELECT * from PURCHASE WHERE PURCHASEID=:P AND phone=:m
  
  `;
 const binds = {
 p:purchaseid,
 m:mobile,

 
 };
return await database.execute(sql, binds, database.options);


}

async function  fromtotime(f,t,train)
{

  const sql = `SELECT V.VISIT_TIME,(SELECT S.STATION_NAME FROM STATION S WHERE V.STATION_ID=S.STATION_ID) AS INTERVAL_STATION
  FROM VISITS V
  WHERE (
    CONVERT_TIME2(getstarttime(:train_name,convert_time4(:f,:t,:train_name)),getfinishtime(:train_name,convert_time4(:f,:t,:train_name)),V.VISIT_TIME)='TRUE'
    
  ) AND TRAIN_ID =(SELECT TRAIN_ID FROM TRAIN WHERE TRAIN_NAME=:train_name) AND ((V.STATION_ID=(SELECT S.STATION_ID FROM STATION S WHERE S.STATION_NAME=:f))  or (V.STATION_ID=(SELECT S.STATION_ID FROM STATION S WHERE S.STATION_NAME=:t)))
  
  `;
 const binds = {
 f:f,
 t:t,
 train_name:train,

 
 };
return await database.execute(sql, binds, database.options);


}
async function  nidname(userid)
{

  const sql = `SELECT N.NAME,N.NID FROM NID N JOIN PERSON P on(N.NID=P.NID and P.PHONE=:u)
  
  `;
 const binds = {
u:userid,

 
 };
return await database.execute(sql, binds, database.options);
}

async function  gettheaccountinformation(userid)
{

  const sql = `SELECT N.NAME,N.NID,N.DOB,N.ADDRESS,P.EMAIL FROM NID N JOIN PERSON P on(N.NID=P.NID and P.PHONE=:u)
  
  `;
 const binds = {
u:userid,

 
 };
return await database.execute(sql, binds, database.options);
}

async function  nidcheck(id)
{

  const sql = `SELECT * FROM NID where NID=:id
  
  `;
 const binds = {
id:id,

 
 };
return await database.execute(sql, binds, database.options);
}






module.exports = {
  getticketdata,
  getCOACHdata,
  getSEATdataAvailable,
  getSEATdataBooked,
  createNewRegester,
  getpersondata,
  getSEATallinformation,
  gettraindetails,
  getdatefortrain,
  getsetpaymentdata,
  updatetheseat,
  getpaymentdetails,
  getstations,
  gettraindetailstimeshow,
  getseatdatabus,
  getbustime,
  getfare,
  updatetheticketseat,
  updatethefinalticketseat,
  deletethebookedseat,
  alreadybookedseat,
  getticketofthebus,
  updatetheticketseatofbus,
  insertintobookedticket,
  personbookedticket,
  purchasetableinsert,
  purchasehistory,
  getdifferenttraindetails,
  fromtogetogtrain,
  getvisitdataagain,
  verifiedticketdata,
  getallthedataofpurchase,
  fromtotime,
  nidname,
  gettheaccountinformation,
  nidcheck
  

};
