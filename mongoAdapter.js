var mongoose = require('mongoose');

const collection = 'collection'
const symbol = '_id'
const success = {success: 1}
mongoose.connect('mongodb://localhost/YOURDATABASENAME');
var emptySchema = new mongoose.Schema({_id: String, data: Object}, { strict: false });
const mongooseModel = (collection)=> mongoose.model(collection, emptySchema, collection);

module.exports = {
	post: (collect, body) => {
	    var Model = mongooseModel(collect);
		return new Promise ((resolve, reject)=>{
			Model(body).save((err, result) => {
			  err ? reject(err) : resolve(success);        
			});
		});
	},

	getAll: (collect) => {
		var Model = mongooseModel(collect);
		return new Promise((resolve, reject)=>{
			Model.find((err, results) => {
				(err) ? reject(err) : resolve(results);  
			});
		})
	},

	getId: (collect, id) => {
		var Model = mongooseModel(collect);
		return new Promise((resolve, reject)=>{
			Model.find({[symbol]: id }, (err, results) => {
				(err) ? reject(err) : resolve(results[0]);  
			});
		});
	},

	patch: (id, collect, body) => {
		var Model = mongooseModel(collect);
		return new Promise((resolve, reject)=>{
			Model.findOneAndUpdate({[symbol]:id}, body, (err) => {
				(err) ? reject(err) : resolve(success);  
			});		
		});
	},

	patchChild: (id, collect, body, child) => {
		var Model = mongooseModel(collect);
		const keys = Object.keys(body);
		return new Promise((resolve, reject)=> {
			keys.forEach((x)=>{
				Model.findOneAndUpdate({[symbol]:id}, {$set: {
					[child+"."+x]: body[x],
				}}, {upsert: true}, (err) => {
					// if any of the update calls fails reject promise, if 
					// the last key in the array is successfull then resolve
					(err) ? reject(err) : (x===keys[keys.length-1] ? resolve(success):null);  
				});		
			});
		})
	},

	deleteId: (id, collect) => {
		var Model = mongooseModel(collect);
		return new Promise((resolve, reject)=>{
			Model.remove({ [symbol]: id }, (err) => {
				(err) ? reject(err) : resolve(success);  
			});
		});
	}

}



