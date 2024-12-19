const mongoose=require('mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/minip",);
const userSchema=mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true,
        
    },
    email:{
        type:String,
        unique:true,
        required:true,
    },
    age:{
        type:Number

    },
    posts:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"post"
        }
    ]
    

},{timestamps:true});
module.exports=mongoose.model('user',userSchema);