module.exports = function(){
    var express = require('express');
    var router = express.Router();

    //populates the house table for /houses
    function getHouses(res, mysql, context, complete){
        let queryString = 'SELECT h.id as house_id, name as house_name, sigil, c.fname, c.lname, hs.status FROM got_house h '
        + ' left join got_characters c on c.id = h.head '
        + ' left join got_house_status hs on hs.id = h.status_id';
        mysql.pool.query(queryString, function(error, results, fields){

            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
            context.houses  = results;
            complete();
        });
    }

    function getCharacters(res, mysql, context, complete){
        let queryString = 'SELECT id, fname, lname FROM got_characters';
        mysql.pool.query(queryString, (err, results, fields)=>{
            if(err){
                res.write(JSON.stringify(err));
                res.end();
            }
            context.characters = results;
            complete();
        })
    }


    function getHouseStatus(res, mysql, context, complete){
        let queryString = 'SELECT id as status_id, status from got_house_status';
        mysql.pool.query(queryString, (err, results, fields)=>{
            if(err){
                res.write(JSON.stringify(err));
                res.end();
            }
            context.status = results;
            complete();
        })
    }




    /*Display all houses.*/

    router.get('/', function(req, res){
        console.log('get/')
        var callbackCount = 0;
        var context = {};
        //fcontext.jsscripts = ["deleteGOT.js"];
        var mysql = req.app.get('mysql');

        getHouses(res, mysql, context, complete);
        getCharacters(res, mysql, context, complete);
        getHouseStatus(res, mysql, context, complete);

        function complete(){
            callbackCount++;
            if(callbackCount >= 3){
                res.render('houses', context);
            }

        }
    });

    router.post('/', function (req, res) {
        console.log('/post')
        console.log(req.body)
        var mysql = req.app.get('mysql');
        var sql = 'INSERT INTO got_house (name, sigil, head, status_id) VALUES (?,?,?,?)';
        var inserts = [req.body.name, req.body.sigil, req.body.head, req.body.status_id];

        //convertEmptyStringToNull(inserts);

        sql = mysql.pool.query(sql, inserts, function(error, results, field){
            if (error) {
                //Take this out for final
                console.log(error)
                res.write(JSON.stringify(error));
                res.end();
            }
            else{
                res.redirect('/houses');
            }
        })
    });

    // returns true if string length is 0
   /* String.prototype.isEmpty = function () {
        return (this.length === 0 || !this.trim());
    };*/

    // changes empty strings to value of null
    /*function convertEmptyStringToNull(inserts){
        inserts.forEach((element, index)=>{
            if(element.isEmpty()){
                inserts[index] = null;
            }

            // if user puts in a bunch of white spaces for the name set fname so app doesn't crash
            if (inserts[0] === null) {
                inserts[0] = 'missing required field';
            }
        });
    }*/

    function getAHouse(res, mysql, context, id, complete){
        var sql = 'SELECT id, name, sigil, head, status_id FROM got_house WHERE id = ?';
        var inserts = [id];
        console.log('GOing through getAHouse');
        mysql.pool.query(sql, inserts, function (error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            }
            context.house = results[0];
            complete();
        });

    }

    // /* Display one person for the specific purpose of updating people */
    router.get('/:id', function (req, res) {
        callbackCount = 0;
        var context = {};
        context.jsscripts = ['selectedCharacter.js', 'selectedStatus.js', 'updatehouse.js'];
        var mysql = req.app.get('mysql');
        console.log('GOing through getFUCKed');

        getAHouse(res, mysql, context, req.params.id, complete);
        getCharacters(res, mysql, context, complete);
        getHouseStatus(res, mysql, context, complete)

        function complete() {
            callbackCount++;
            if (callbackCount >= 3) {
                res.render('update-house', context);
            }
        }
    });

    // /* The URI that update data is sent to in order to update a house */

    router.put('/:id', function (req, res) {
        var mysql = req.app.get('mysql');
        console.log('put/:id')
        console.log(req.body)
        console.log(req.params.id)
        console.log('GOing through put1');


        var sql = 'UPDATE got_house SET name = ?, sigil = ?, head = ?, status_id = ? WHERE id = ?';
        var inserts = [
            req.body.name,
            req.body.sigil,
            req.body.head,
            req.body.status_id,
            req.params.id
        ];

        //convertEmptyStringToNull(inserts);
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



    return router;
}();
