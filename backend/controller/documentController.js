const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createDocument = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const existingDocument = await prisma.document.findUnique({
            where: { userId }
        });

        if (existingDocument) {
            return res.status(400).json({
                success: false,
                message: "Document already exists for this user"
            });
        }

        const { licenseNumber, productionYear } = req.body;

        const blueBookImages = req.files?.blueBookImage?.map(file => file.path) || [];
        const vehicleImages = req.files?.vehicleImage?.map(file => file.path) || [];

        if (blueBookImages.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one blue book image is required"
            });
        }

        if (vehicleImages.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one vehicle image is required"
            });
        }

        if (blueBookImages.length > 3) {
            return res.status(400).json({
                success: false,
                message: "Maximum 3 blue book images allowed"
            });
        }

        if (vehicleImages.length > 3) {
            return res.status(400).json({
                success: false,
                message: "Maximum 3 vehicle images allowed"
            });
        }

        const document = await prisma.document.create({
            data: {
                licenseNumber: parseInt(licenseNumber),
                blueBookImage: blueBookImages,
                vehicleImage: vehicleImages,
                productionYear: parseInt(productionYear),
                userId,
                status: "PENDING" 
            }
        });

        res.status(201).json({
            success: true,
            data: document
        });
    } catch (error) {
        console.error("Document creation error:", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const getAllDocuments = async (req, res) => {
    try {
      const documents = await prisma.document.findMany({
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      res.status(200).json(documents);
    } catch (error) {
      res.status(500).json({ 
        message: "Error fetching documents", 
        error: error.message 
      });
    }
  };
  
  const getDocumentById = async (req, res) => {
    try {
      const document = await prisma.document.findUnique({
        where: {
          id: parseInt(req.params.id)
        },
        include: {
          user: true
        }
      });
  
      if (!document) {
        return res.status(404).json({ 
          message: 'Document not found' 
        });
      }
  
      res.status(200).json(document);
    } catch (error) {
      res.status(500).json({ 
        message: "Error fetching document", 
        error: error.message 
      });
    }
  };
  
  const updateDocument = async (req, res) => {
    try {
      const { licenseNumber, productionYear } = req.body;
  
      const blueBookImage = req.files?.blueBookImage?.map(file => file.path);
      const vehicleImage = req.files?.vehicleImage?.map(file => file.path);
  
      const updateData = {
        ...(licenseNumber && { licenseNumber: parseInt(licenseNumber) }),
        ...(productionYear && { productionYear: parseInt(productionYear) }),
        ...(blueBookImage && { blueBookImage }),
        ...(vehicleImage && { vehicleImage })
      };
  
      const document = await prisma.document.update({
        where: {
          id: parseInt(req.params.id)
        },
        data: updateData,
        include: {
          user: true
        }
      });
  
      res.status(200).json(document);
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ 
          message: 'Document not found' 
        });
      }
      res.status(400).json({ 
        message: error.message 
      });
    }
  };
  
  const deleteDocument = async (req, res) => {
    try {
      await prisma.document.delete({
        where: {
          id: parseInt(req.params.id)
        }
      });
  
      res.status(200).json({ 
        message: 'Document deleted successfully' 
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ 
          message: 'Document not found' 
        });
      }
      res.status(500).json({ 
        message: error.message 
      });
    }
  };
  
  const approveDocument = async (req, res) => {
    try {
      const document = await prisma.document.update({
        where: {
          id: parseInt(req.params.id)
        },
        data: {
          status: "APPROVED",
          adminComment: req.body.adminComment || null
        },
        include: {
          user: true
        }
      });
  
      res.status(200).json(document);
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ 
          message: 'Document not found' 
        });
      }
      res.status(400).json({ 
        message: error.message 
      });
    }
  };
  
  const rejectDocument = async (req, res) => {
    try {
      const document = await prisma.document.update({
        where: {
          id: parseInt(req.params.id)
        },
        data: {
          status: "REJECTED",
          adminComment: req.body.adminComment
        },
        include: {
          user: true
        }
      });
  
      res.status(200).json(document);
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ 
          message: 'Document not found' 
        });
      }
      res.status(400).json({ 
        message: error.message 
      });
    }
  };

module.exports = {
    createDocument,
    getDocumentById,
    getAllDocuments,
    updateDocument,
    deleteDocument,
    approveDocument,
    rejectDocument
};