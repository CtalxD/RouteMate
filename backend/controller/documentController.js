//backend/controller/documentController.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createDocument = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if document exists and its status
    const existingDocument = await prisma.document.findUnique({ 
      where: { userId },
      include: { user: true }
    });

    // If document exists and is approved
    if (existingDocument && existingDocument.status === "APPROVED") {
      return res.status(400).json({ 
        success: false, 
        message: "Document already uploaded and approved",
        document: existingDocument
      });
    }

    // If document exists and is pending
    if (existingDocument && existingDocument.status === "PENDING") {
      return res.status(400).json({ 
        success: false, 
        message: "Document already uploaded and pending review",
        document: existingDocument
      });
    }

    const { licenseNumber, productionYear, busNumber } = req.body;

    // If document exists but was rejected, update it
    if (existingDocument && existingDocument.status === "REJECTED") {
      const updatedDocument = await prisma.document.update({
        where: { userId },
        data: {
          licenseNumber: Number.parseInt(licenseNumber),
          productionYear: Number.parseInt(productionYear),
          busNumber,
          status: "PENDING",
          adminComment: null, // Clear previous admin comment
        },
      });
      return res.status(200).json({ 
        success: true, 
        message: "Document reuploaded successfully after rejection",
        data: updatedDocument 
      });
    }

    // Create new document if none exists
    const document = await prisma.document.create({
      data: {
        licenseNumber: Number.parseInt(licenseNumber),
        productionYear: Number.parseInt(productionYear),
        busNumber,
        userId,
        status: "PENDING",
      },
      include: { user: true }
    });

    res.status(201).json({ 
      success: true, 
      message: "Document uploaded successfully",
      data: document 
    });
  } catch (error) {
    console.error("Document creation error:", error);
    res.status(500).json({ 
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
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.status(200).json(documents);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching documents",
      error: error.message,
    });
  }
};

const getDocumentById = async (req, res) => {
  try {
    const document = await prisma.document.findUnique({
      where: {
        id: Number.parseInt(req.params.id),
      },
      include: {
        user: true,
      },
    });

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    res.status(200).json(document);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching document",
      error: error.message,
    });
  }
};

const updateDocument = async (req, res) => {
  try {
    const { licenseNumber, productionYear, busNumber } = req.body;

    const updateData = {
      ...(licenseNumber && { licenseNumber: Number.parseInt(licenseNumber) }),
      ...(productionYear && { productionYear: Number.parseInt(productionYear) }),
      ...(busNumber && { busNumber }),
    };

    const document = await prisma.document.update({
      where: {
        id: Number.parseInt(req.params.id),
      },
      data: updateData,
      include: {
        user: true,
      },
    });

    res.status(200).json(document);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        message: "Document not found",
      });
    }
    res.status(400).json({
      message: error.message,
    });
  }
};

const deleteDocument = async (req, res) => {
  try {
    await prisma.document.delete({
      where: {
        id: Number.parseInt(req.params.id),
      },
    });

    res.status(200).json({
      message: "Document deleted successfully",
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        message: "Document not found",
      });
    }
    res.status(500).json({
      message: error.message,
    });
  }
};

const approveDocument = async (req, res) => {
  try {
    const documentToApprove = await prisma.document.findUnique({
      where: {
        id: Number.parseInt(req.params.id),
      },
      include: {
        user: true,
      },
    });

    if (!documentToApprove) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    // Check if bus with this number already exists
    const existingBus = await prisma.bus.findFirst({
      where: {
        busNumber: documentToApprove.busNumber,
      },
    });

    // If bus doesn't exist, create it with user association
    if (!existingBus && documentToApprove.busNumber) {
      await prisma.bus.create({
        data: {
          busNumber: documentToApprove.busNumber,
          userId: documentToApprove.userId,
          driverName: `${documentToApprove.user.firstName} ${documentToApprove.user.lastName}`,
        },
      });
    } else if (existingBus) {
      // If bus exists, update it with user association
      await prisma.bus.update({
        where: {
          busId: existingBus.busId,
        },
        data: {
          userId: documentToApprove.userId,
          driverName: `${documentToApprove.user.firstName} ${documentToApprove.user.lastName}`,
        },
      });
    }

    // Approve the document
    const document = await prisma.document.update({
      where: {
        id: Number.parseInt(req.params.id),
      },
      data: {
        status: "APPROVED",
        adminComment: req.body.adminComment || null,
        user: {
          update: {
            role: "DRIVER",
          },
        },
      },
      include: {
        user: true,
      },
    });

    res.status(200).json(document);
  } catch (error) {   
    if (error.code === "P2025") {
      return res.status(404).json({
        message: "Document not found",
      });
    }
    res.status(400).json({
      message: error.message,
    });
  }
};

const rejectDocument = async (req, res) => {
  try {
    const { adminComment } = req.body;
    if (!adminComment) {
      return res.status(400).json({
        message: "Admin comment is required when rejecting a document",
      });
    }

    const document = await prisma.document.update({
      where: {
        id: Number.parseInt(req.params.id),
      },
      data: {
        status: "REJECTED",
        adminComment,
      },
      include: {
        user: true,
      },
    });

    res.status(200).json(document);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        message: "Document not found",
      });
    }
    res.status(400).json({
      message: error.message,
    });
  }
};

const getAllDrivers = async (req, res) => {
  try {
    const drivers = await prisma.user.findMany({
      where: {
        OR: [
          { role: "DRIVER" },
          { role: "ADMIN" },
        ],
      },
      include: {
        document: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json(drivers);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching drivers",
      error: error.message,
    });
  }
};

const revokeDriver = async (req, res) => {
  try {
    const { userId } = req.params;
    const { adminComment } = req.body;

    // Update user role to USER
    const updatedUser = await prisma.user.update({
      where: { id: Number.parseInt(userId) },
      data: {
        role: "USER",
      },
      include: {
        document: true,
      },
    });

    // If user has a document, update it with admin comment
    if (updatedUser.document) {
      await prisma.document.update({
        where: { userId: Number.parseInt(userId) },
        data: {
          adminComment: adminComment || null,
          status: "REJECTED",
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Driver status revoked successfully",
      user: updatedUser,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        message: "User not found",
      });
    }
    res.status(500).json({
      message: "Error revoking driver status",
      error: error.message,
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
  rejectDocument,
  getAllDrivers,
  revokeDriver,
};