const mongoose=require('mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/minip");
const postSchema=mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    },
    content:String,
    likes:[
        {type: mongoose.Schema.Types.ObjectId,ref:"user"}
    ]


},{timestamps:true});
module.exports=mongoose.model('post',postSchema); 