const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createDocument = async (req, res) => {
    try {
        const userId = parseInt(req.user.id);
        
        // Check if user already has a document
        const existingDocument = await prisma.document.findUnique({
            where: { userId }
        });

        if (existingDocument) {
            return res.status(400).json({
                success: false,
                message: "Document already exists for this user"
            });
        }

        const {
            licenseNumber,
            productionYear,
        } = req.body;

        const blueBookImage = req.files?.blueBookImage?.map(file => file.path) || [];
        const vehicleImage = req.files?.vehicleImage?.map(file => file.path) || [];

        // Validate required files
        if (blueBookImage.length === 0 || vehicleImage.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Both blue book and vehicle images are required"
            });
        }

        const document = await prisma.document.create({
            data: {
                licenseNumber: parseInt(licenseNumber),
                blueBookImage,
                vehicleImage,
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
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Get all documents
const getAllDocuments = async (req, res) => {
    try {
        const documents = await prisma.document.findMany({
            include: {
                user: true
            }
        });
        res.status(200).json({
            success: true,
            data: documents
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get document by ID
const getDocumentById = async (req, res) => {
    try {
        const document = await prisma.document.findUnique({
            where: {
                id: parseInt(req.user.id)
            },
            include: {
                user: true
            }
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        res.status(200).json({
            success: true,
            data: document
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update document
const updateDocument = async (req, res) => {
    try {
        const {
            licenseNumber,
            productionYear
        } = req.body;

        // Handle file uploads for updates
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

        res.status(200).json({
            success: true,
            data: document
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Delete document
const deleteDocument = async (req, res) => {
    try {
        await prisma.document.delete({
            where: {
                id: parseInt(req.params.id)
            }
        });

        res.status(200).json({
            success: true,
            message: 'Document deleted successfully'
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports ={
createDocument,
getDocumentById,
getAllDocuments,
updateDocument,
deleteDocument
} 