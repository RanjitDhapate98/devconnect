//this function is for custom error class 
//Instead of sending response manually  we send error like this in controller : throw new AppError("User not found", 404);

class AppError extends Error{
    constructor(message,statusCode){
            super(message);
            this.statusCode=statusCode;
            this.status=statusCode >=400 && statusCode<500 ? "fail":"error";
            Error.captureStackTrace(this,this.constructor);
    }
}
module.exports=AppError;