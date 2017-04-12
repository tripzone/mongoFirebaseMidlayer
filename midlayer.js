var express = require('express');
var bodyParser = require('body-parser');
var mongo = require('./mongoAdapter.js')
var firebase = require('./firebaseAdapter.js')
var Rx = require('rxjs/Rx');
var request = require("request");
var diff = require('deep-diff').diff;
var app = express();
app.use(bodyParser.json())

var portListen = 6000;
app.listen(portListen);
console.log('Listening on port '+ portListen +'...');

// ENDPOINTS
app.get('/', getAll);
app.get('/:id', getId);
app.post('/:id' , post);
app.patch('/:id', patch);
app.delete('/:id', deleteId);
app.get('/:id/keys', getKeys);

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, db, collection, id");
  next();
});

const collect = 'collectionName';
const collection = 'collection';
const success = {success: 1}
const fail = {success: 0}

function post(req,res){
	// set up request parameters
	var data = req.body;
	var item = req.params.id
	var mongoBody = req;
	var firebaseReq ={}
	mongoBody = Object.assign({}, data,{_id: req.params.id})

	const mongoPost$ = new Rx.Observable.fromPromise(mongo.post(collect, mongoBody))
		.catch(x=>{
			if(x.code == 11000) {
				throw({error: 'MONGO_POST_FAILED_DUPLICATED_KEY', desc: x})
			} else {
				throw({error: 'MONGO_POST_FAILED_GENERAL', desc: x})
			}
		})

	const firebasePost$ = new Rx.Observable.fromPromise(firebase.post(item, data))
		.catch(x=>{throw({error: 'FIREBASE_POST_FAILED', desc: x})})

	const post$ = new Rx.Observable.combineLatest(mongoPost$, firebasePost$)
		.subscribe(
			x=>console.log(x),
			err=>res.status(500).send(err),
			comp=>res.status(200).send(success)
		)
}

function getAll(req, res) {
	mongo.getAll(collect).then(
		(x)=> res.status(200).send(x),
		(err)=> res.status(500).send(err)
	);
}

function getId(req, res) {
	// mongo.getId(req.header(collection), req.params.id).then((x)=> res.status(200).send(x));
	var item = req.params.id;
	firebase.getId(item).then(
		(x)=> res.status(200).send(x),
		(err)=> res.status(500).send(err)
	);
}

function patch(req, res){
	// mongo.patch(req).then((x)=> res.status(200).send(success));
	var item = req.params.id;
	var data = req.body;
	mongoPatch$ = Rx.Observable.fromPromise(mongo.patch(item, collect, data))
		.catch(x=>{throw({error: 'MONGO_PATCH_FAILED', desc: x})})
	firebasePatch$ = Rx.Observable.fromPromise(firebase.patch(item, data))
		.catch(x=>{throw({error: 'FIREBASE_PATCH_FAILED', desc: x})})

	return Rx.Observable.combineLatest(mongoPatch$, firebasePatch$)
		.subscribe(
			x=>console.log(x),
			err=>res.status(500).send(err),
			comp=>res.status(200).send(success)
		)
}

function deleteId(req,res) {
	const child = req.header(collection) ? req.header(collection) : null;
	var item = req.params.id;
	mongoDelete$ = Rx.Observable.fromPromise(mongo.deleteId(item, collect))
		.catch(x=>{throw({error: 'MONGO_PATCH_FAILED', desc: x})});
	var item = req.params.id;
	firebaseDelete$ = Rx.Observable.fromPromise(firebase.deleteId(item))
		.catch(x=>{throw({error: 'FIREBASE_PATCH_FAILED', desc: x})});

	return Rx.Observable.combineLatest(mongoDelete$, firebaseDelete$)
		.subscribe(
			x=>console.log(x),
			err=>res.status(500).send(err),
			comp=>res.status(200).send(success)
		)
}

function getKeys(req, res) {
	const item = req.params.id;
	firebase.getKeys(item).then(
		(x)=> res.status(200).send(x),
		(err)=> res.status(500).send(err)
	);
}

