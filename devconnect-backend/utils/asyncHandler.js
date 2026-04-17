//so basically me are making our code as centralized errore handeler 
//after removing try catch block in our code if any error happend that was not been handeled by out express centralized handeler and our code will be crash
//thats why we frowarded that error to || catch(next) || ceh

const asyncHandler=(fn)=>{
    return(req,res,next)=>{
        Promise.resolve(fn(req,res,next)).catch(next);
    };
};
module.exports=asyncHandler;