module.exports = function () {
    var express = require('express');
    var router = express.Router();

    //populates the character table for /characters
    function getCharacters(res, mysql, context, complete) {
        let queryString = 'SELECT c.id, fname, lname, h.name as house_name, l.name as location_name, weapon, status, organization, s.name as species_name FROM got_characters c'
        + ' left join got_house h on h.id = c.house_id'
        + ' left join got_locations l on l.id = c.origin'
        + ' left join got_species s on s.id = c.species_id';
        mysql.pool.query(queryString, function(error, results, fields){

            if (error) {
                res.write(JSON.stringify(error));
                // make sure to use your dbcon credentials!
                res.end();
            }
            context.characters = results;
            complete();
        });
    }

    //populates species form in the edit button
    function getSpecies(res, mysql, context, complete) {
        let queryString = 'select id as species_id, name as species_name from got_species';
        mysql.pool.query(queryString, (err,results,fields)=>{
            if(err){
                res.write(JSON.stringify(err));
                res.end();
            }
            context.species = results;
            complete();
        })
    }
    

    // populates houses form in the Edit button
    function getHouses(res, mysql, context, complete){
        let queryString = 'SELECT id as house_id, name as house_name from got_house';
        mysql.pool.query(queryString, (err, results, fields)=>{
            if(err){
                res.write(JSON.stringify(err));
                res.end();
            }
            context.houses = results;
            complete();
        });
    }
    
    // populate locations form in the Edit button
    function getLocations(res, mysql, context, complete){
        let queryString = 'SELECT id, name FROM got_locations';
        mysql.pool.query(queryString, (err, results, fields)=>{
            if(err){
                res.write(JSON.stringify(err));
                res.end();
            }
            context.locations = results;
            complete();
        })
    }
    /*Display all people. Requires web based javascript to delete users with AJAX*/

    router.get('/', function (req, res) {
        console.log('get/')
        var callbackCount = 0;  
        var context = {};
        context.jsscripts = ["deleteGOT.js"];
        var mysql = req.app.get('mysql');

        getLocations(res, mysql, context, complete);
        getSpecies(res, mysql, context, complete);
        getCharacters(res, mysql, context, complete);
        getHouses(res, mysql, context, complete);

        function complete() {
            callbackCount++;
            if (callbackCount >= 4) {  //adding more get functions increase this number!!
                res.render('characters', context);
            }
        }
    });

    router.post('/', function (req, res) {
        console.log('/post')
        console.log(req.body)
        var mysql = req.app.get('mysql');
        var sql = 'INSERT INTO got_characters (fname, lname, house_id, origin, weapon, species_id, status, organization) VALUES (?,?,?,?,?,?,?,?)';
        var inserts = [req.body.fname, req.body.lname, req.body.house_id, req.body.location_id, req.body.weapon, req.body.species_id, req.body.status, req.body.organization];
        
        convertEmptyStringToNull(inserts);

        sql = mysql.pool.query(sql, inserts, function(error, results, field){
            if (error) {
                console.log(error)
                res.write(JSON.stringify(error));
                res.end();
            }
            else{
                res.redirect('/characters');
            }
        })
    });

// returns true if string length is 0
    String.prototype.isEmpty = function () {
        return (this.length === 0 || !this.trim());
    };

    // changes empty strings to value of null
    function convertEmptyStringToNull(inserts){
        inserts.forEach((element, index)=>{
            if(element.isEmpty()){
                inserts[index] = null;
            }

            // if user puts in a bunch of white spaces for the name set fname so app doesn't crash
            if (inserts[0] === null) {
                inserts[0] = 'missing required field';
            }
        });
    }

    // /*Display all people from a given homeworld. Requires web based javascript to delete users with AJAX*/
    // router.get('/filter/:homeworld', function (req, res) {
    //     var callbackCount = 0;
    //     var context = {};
    //     context.jsscripts = ["deleteperson.js", "filterpeople.js", "searchpeople.js"];
    //     var mysql = req.app.get('mysql');
    //     getPeoplebyHomeworld(req, res, mysql, context, complete);
    //     getPlanets(res, mysql, context, complete);
    //     function complete() {
    //         callbackCount++;
    //         if (callbackCount >= 2) {
    //             res.render('people', context);
    //         }

    //     }
    // });

    function getACharacter(res, mysql, context, id, complete){
        var sql = 'SELECT id, fname, lname, house_id, origin, weapon, species_id, status, organization FROM got_characters WHERE id = ?';
        var inserts = [id];
        mysql.pool.query(sql, inserts, function (error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            }
            context.character = results[0];
            complete();
        });

    }
    // /* Display one person for the specific purpose of updating people */
    router.get('/:id', function (req, res) {
        callbackCount = 0;
        var context = {};
        context.jsscripts = ['selectedhouse.js', 'selectedlocation.js', 'selectedspecies.js', 'selectedstatus.js', 'updatecharacter.js'];
        var mysql = req.app.get('mysql');

        getACharacter(res, mysql, context, req.params.id, complete);
        getLocations(res, mysql, context, complete);
        getSpecies(res, mysql, context, complete);
        getHouses(res, mysql, context, complete);

        function complete() {
            callbackCount++;
            if (callbackCount >= 4) {
                res.render('update-character', context);
            }
        }
    });
    
    // /* The URI that update data is sent to in order to update a person */

    router.put('/:id', function (req, res) {
        var mysql = req.app.get('mysql');
        console.log('put/:id')
        console.log(req.body)
        console.log(req.params.id)


        var sql = 'UPDATE got_characters SET fname = ?, lname = ?, house_id = ?, origin = ?, weapon = ?, status = ?, organization = ?, species_id = ? WHERE id = ?';
        var inserts = [
            req.body.fname,
            req.body.lname,
            req.body.house_id,
            req.body.location_id,
            req.body.weapon,
            req.body.status,
            req.body.organization,
            req.body.species_id,
            req.params.id
        ];

        convertEmptyStringToNull(inserts);
        sql = mysql.pool.query(sql, inserts, function (error, results, fields) {
            if (error) {
                console.log(error)
                res.write(JSON.stringify(error));
                res.end();
            } else {
                res.status(200);
                res.end();
            }
        });
    });


    /* Route to delete a person, simply returns a 202 upon success. Ajax will handle this. */

    router.delete('/:id', function (req, res) {
        console.log('delete id: ' + JSON.stringify(req.params));
        var mysql = req.app.get('mysql');
        var sql = "DELETE FROM got_characters WHERE id = ?";
        var inserts = [req.params.id];
        sql = mysql.pool.query(sql, inserts, function (error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.status(400);
                res.end();
            } else {
                res.status(202).end();
            }
        })
    })

    return router;
}();
