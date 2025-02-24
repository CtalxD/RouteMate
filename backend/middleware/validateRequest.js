const validateRequest = (schema) => {
    return (req, res, next) => {
      try {
        schema.parse(req.body);
        next();
      } catch (error) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.errors
        });
      }
    };
  };
  
  module.exports = {validateRequest}