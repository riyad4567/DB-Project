const database = require('./database');


async function getTrains(setdata)
{
  console.log(setdata.FROM);
  console.log(setdata.TO);
  
const sql=`SELECT TRAIN_NAME FROM TRAIN WHERE TRAIN_ID IN

    (SELECT V.TRAIN_ID 
     
  FROM VISITS V
  JOIN STATION S ON V.STATION_ID = S.STATION_ID
  WHERE S.STATION_NAME=:F
  INTERSECT 
  SELECT V.TRAIN_ID 
  FROM VISITS V
  JOIN STATION S ON V.STATION_ID = S.STATION_ID
  WHERE S.STATION_NAME=:T)
`;
const binds={
  F:setdata.FROM,
  T:setdata.TO,
  

};
return (await database.execute(sql, binds, database.options));
}
async function getbus(setdata)
{
  console.log(setdata.FROM);
  console.log(setdata.TO);
  
const sql=`SELECT bs.BUS_NAME,b2.BUS_ID 
FROM BUSCOMPANY bs JOIN BUS b2 ON(bs.BUSCOMPANY_ID=b2.BUSCOMPANY_ID)
WHERE bs.BUSCOMPANY_ID IN
(
  SELECT BUSCOMPANY_ID
  FROM BUS B
  WHERE B.DESTINATION_PLACE=:F AND B.START_PLACE=:T
)
`;
const binds={
  F:setdata.FROM,
  T:setdata.TO,
  

};
return (await database.execute(sql, binds, database.options));
}


module.exports={getTrains,getbus};