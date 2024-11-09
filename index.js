const express = require('express');
const db = require('./db');
const cors = require('cors');
const app = express();
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const SECRET_KEY = 'your_secret_key'; // Change this to a strong secret key

// app.use(cors({ origin: '*' }));
app.use(cors({ origins: '*' }));

app.get('/', async (req, res) => {
  try {
    const cmnd = "SELECT  name, reservation_id from crm_reservation_product"
    const result = await db.query(cmnd); //where id = 4120');
    res.json(result.rows);
    console.log("results:", result.rows)
    console.log('Received upload request');
    console.log(req.headers);
    console.log(req.body);
    // Handle the file upload here
    res.status(200).send('File uploaded successfully');
  } catch (err) {
    console.error(err);
  }
});


//DevisWithDoubleReservation
const DevisWithDoubleReservationsqlQuery = `WITH RankedResults AS (
  SELECT so.name AS Nom_du_bon_de_commande, so.id as ID, r.name AS Nom_de_la_reservation, r.order_id, c.order_id_count AS nombre_de_reservations_pour_ce_devis,
         ROW_NUMBER() OVER(PARTITION BY so.name ORDER BY c.order_id_count DESC) AS rn
  FROM crm_reservation r
  JOIN (
    SELECT order_id, COUNT(order_id) AS order_id_count
    FROM crm_reservation
    WHERE state = 'valid'
    GROUP BY order_id
  ) c ON r.order_id = c.order_id
  JOIN sale_order so ON r.order_id = so.id
  WHERE r.state = 'valid' AND order_id_count > 1
)
SELECT Nom_du_bon_de_commande, Nom_de_la_reservation, ID, order_id, nombre_de_reservations_pour_ce_devis
FROM RankedResults
WHERE rn = 1
ORDER BY nombre_de_reservations_pour_ce_devis DESC`
;

app.get('/DevisWithDoubleReservation', async (req, res) => {
  try {
    const cmnd = DevisWithDoubleReservationsqlQuery;
    const result = await db.query(cmnd); //where id = 4120');
    res.json(result.rows);
    console.log("results:", result.rows)
    console.log('Received upload request');
    console.log(req.headers);
    console.log(req.body);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});


//DevisWithDoubleReservation
app.get('/DWDR/:so', async (req, res) => {
  const { so } = req.params; // Access the 'so' parameter from the URL

  try {
    // Use parameterized query to safely inject the value of 'so' into the SQL query
    const DWDRsqlQuery = `
      SELECT r.name 
      FROM crm_reservation r
      JOIN sale_order s ON s.id = r.order_id
      WHERE s.name = $1
    `;
    
    // Execute the parameterized query with the 'so' value
    const result = await db.query(DWDRsqlQuery, [so]);

    // Send the query results as a JSON response
    res.json(result.rows);

    // Log to the console for debugging purposes
    console.log("Query results:", result.rows);
    console.log('Received GET request for DWDR');
    console.log("so:", so);
  } catch (err) {
    // Handle database query errors
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// ReservationMultipleProducts
const ReservationMultipleProductssqlQuery = `
SELECT cr.name, cr.id as ID,  crp.reservation_id, COUNT(crp.reservation_id) AS count FROM crm_reservation_product crp LEFT JOIN crm_reservation cr ON crp.reservation_id = cr.id GROUP BY cr.name, cr.id, crp.reservation_id HAVING COUNT(crp.reservation_id) > 1;`;
app.get('/ReservationMultipleProducts', async (req, res) => {
  try {
    const cmnd = ReservationMultipleProductssqlQuery;
    const result = await db.query(cmnd); //where id = 4120');
    res.json(result.rows);
    console.log("results:", result.rows)
    console.log('Received upload request');
    console.log(req.headers);
    console.log(req.body);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// ReservationNoDevis
const ReservationNoDevissqlQuery = ` select id AS ID, name As Reservation_Name, state AS etat from crm_reservation where order_id IS NULL`;
app.get('/ReservationNoDevis', async (req, res) => {
  try {
    const cmnd = ReservationNoDevissqlQuery;
    const result = await db.query(cmnd); //where id = 4120');
    res.json(result.rows);
    console.log("results:", result.rows)
    console.log('Received upload request');
    console.log(req.headers);
    console.log(req.body);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// ReservationValidProductLibre
const ReservationValidProductLibresqlQuery = ` SELECT
    cr.name AS reservation_name, cr.state AS reservation_etat ,cr.id AS ID , pt.id AS product_id, pt.name AS product_name, pt.etat AS etat
FROM
    crm_reservation_product crp
JOIN
    product_template pt ON crp.name = pt.id
JOIN
    crm_reservation cr ON crp.reservation_id = cr.id
WHERE
    pt.etat = 'Libre' AND cr.state = 'valid' ; `;
app.get('/ReservationValidProductLibre', async (req, res) => {
  try {
    const cmnd = ReservationValidProductLibresqlQuery;
    const result = await db.query(cmnd); //where id = 4120');
    res.json(result.rows);
    console.log("results:", result.rows)
    console.log('Received upload request');
    console.log(req.headers);
    console.log(req.body);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

//ReservationValidDeviCancel
const ReservationValidDeviCancelsqlQuery = ` select so.name, so.id, so.state as etat_de_reservation,  rp.name as Chargé_de_recouvrement , r.name AS reservation_name , r.state AS reservation_etat
from crm_reservation r
JOIN res_users ru ON ru.id = r.charge_recouv_id
JOIN res_partner rp ON rp.id = ru.partner_id
Join (select  * from sale_order )so ON so.id = r.order_id 
where so.state = 'cancel' AND r.state = 'valid'`;
app.get('/ReservationValidDeviCancel', async (req, res) => {
  try {
    const cmnd = ReservationValidDeviCancelsqlQuery;
    const result = await db.query(cmnd); //where id = 4120');
    res.json(result.rows);
    console.log("results:", result.rows)
    console.log('Received upload request');
    console.log(req.headers);
    console.log(req.body);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

//DevisWithNoReservation
const DevisWithNoReservationsqlQuery = ` select so.id, so.name, so.state as etat_de_reservation,  rp.name as Chargé_de_recouvrement from sale_order so
JOIN res_users ru ON ru.id = so.charge_recouv_id
JOIN res_partner rp ON rp.id = ru.partner_id
LEFT JOIN crm_reservation cr ON so.id = cr.order_id
WHERE  cr.order_id IS NULL;
 `;
app.get('/DevisWithNoReservation', async (req, res) => {
  try {
    const cmnd = DevisWithNoReservationsqlQuery;
    const result = await db.query(cmnd); //where id = 4120');
    res.json(result.rows);
    console.log("results:", result.rows)
    console.log('Received upload request');
    console.log(req.headers);
    console.log(req.body);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

//DevisValidReservationNotValid
const DevisValidReservationNotValidsqlQuery = `select so.id, so.name, so.state as etat_de_reservation,  rp.name as Chargé_de_recouvrement from sale_order so
JOIN res_users ru ON ru.id = so.charge_recouv_id
JOIN res_partner rp ON rp.id = ru.partner_id
JOIN (select * from crm_reservation ) cr ON so.id = cr.order_id
where cr.state NOT IN('valid') AND so.state='sale'
 `;
app.get('/DevisValidReservationNotValid', async (req, res) => {
  try {
    const cmnd = DevisValidReservationNotValidsqlQuery;
    const result = await db.query(cmnd); //where id = 4120');
    res.json(result.rows);
    console.log("results:", result.rows)
    console.log('Received upload request');
    console.log(req.headers);
    console.log(req.body);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

//SoSolNotEqual
const SoSolNotEqualsqlQuery = ` 
select so.id ,so.name ,so.state as state_SO, sol.id as sol, sol.state as sol_state ,  rp.name as Chargé_de_recouvrement  from sale_order_line sol
JOIN sale_order so ON so.id = sol.order_id
JOIN res_users ru ON ru.id = so.charge_recouv_id
JOIN res_partner rp ON rp.id = ru.partner_id
where so.state != sol.state
 `;
app.get('/SoSolNotEqual', async (req, res) => {
  try {
    const cmnd = SoSolNotEqualsqlQuery;
    const result = await db.query(cmnd); //where id = 4120');
    res.json(result.rows);
    console.log("results:", result.rows)
    console.log('Received upload request');
    console.log(req.headers);
    console.log(req.body);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

//CrmReservationProductCrmReservation
const CrmReservationProductCrmReservationsqlQuery = ` SELECT 
    cr.id, cr.name
FROM 
    crm_reservation cr
WHERE 
    cr.id NOT IN (SELECT crp.reservation_id FROM crm_reservation_product crp);

 `;
app.get('/CrmReservationProductCrmReservation', async (req, res) => {
  try {
    const cmnd = CrmReservationProductCrmReservationsqlQuery;
    const result = await db.query(cmnd); //where id = 4120');
    res.json(result.rows);
    console.log("results:", result.rows)
    console.log('Received upload request');
    console.log(req.headers);
    console.log(req.body);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});


//SoNotInSol
const SoNotInSolsqlQuery = ` select so.id, so.name,so.state as etat_de_reservation,  rp.name as Chargé_de_recouvrement from sale_order so
JOIN res_users ru ON ru.id = so.charge_recouv_id
JOIN res_partner rp ON rp.id = ru.partner_id
WHERE so.id NOT IN (SELECT sol.order_id from sale_order_line sol )
 `;
app.get('/SoNotInSol', async (req, res) => {
  try {
    const cmnd = SoNotInSolsqlQuery;
    const result = await db.query(cmnd); 
    res.json(result.rows);
    console.log("results:", result.rows)
    console.log('Received upload request');
    console.log(req.headers);
    console.log(req.body);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

//SoNoReservation
const SoNoReservationsqlQuery = ` select so.id, so.name, so.state as etat_de_reservation,  rp.name as Chargé_de_recouvrement from sale_order so
JOIN res_users ru ON ru.id = so.charge_recouv_id
JOIN res_partner rp ON rp.id = ru.partner_id
where have_reservation = false
`;
app.get('/SoNoReservation', async (req, res) => {
  try {
    const cmnd = SoNoReservationsqlQuery;
    const result = await db.query(cmnd); 
    res.json(result.rows);
    console.log("results:", result.rows)
    console.log('Received upload request');
    console.log(req.headers);
    console.log(req.body);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});


const path = require('path');

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const usersFilePath = 'users.json'
//path.join(__dirname, 'users.json');

// Load users from JSON file
const users = JSON.parse(fs.readFileSync('users.json'));

// Authenticate user
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
      const token = jwt.sign({ email: user.email }, SECRET_KEY, { expiresIn: '1h' });
      res.json({ token });
  } else {
      res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Middleware to verify token
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  console.log("fine")

  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, SECRET_KEY, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
  });
};

// Protected route example
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

app.listen(3002, () => {
    console.log('Express server running on port 3002');
});