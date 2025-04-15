const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createDocument = async (req, res) => {
  try {
    const userId = req.user.id;

    const existingDocument = await prisma.document.findUnique({ where: { userId } });
    if (existingDocument) {
      return res.status(400).json({ success: false, message: "Document already exists for this user" });
    }

    const licenseNumber = req.body.licenseNumber;
    const productionYear = req.body.productionYear;

    const document = await prisma.document.create({
      data: {
        licenseNumber: parseInt(licenseNumber),
        productionYear: parseInt(productionYear),
        userId,
        status: "PENDING",
      },
    });

    res.status(201).json({ success: true, data: document });

  } catch (error) {
    console.error("Document creation error:", error);
    res.status(500).json({ success: false, message: error.message });
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
              email: true,
              role: true,
              document: true,
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
          id: req.user.id
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
  
      const updateData = {
        ...(licenseNumber && { licenseNumber: parseInt(licenseNumber) }),
        ...(productionYear && { productionYear: parseInt(productionYear) }),
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
          id: parseInt(req.params.id),
        },
        data: {
          status: "APPROVED",
          adminComment: req.body.adminComment || null,
          user: {
            update: {
              role: "DRIVER"
            }
          }
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