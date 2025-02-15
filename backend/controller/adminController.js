// const reviewDocument = async (req, res) => {
//     try {
//         const { documentId } = req.params;
//         const { status, adminComment } = req.body;

//         // Validate status
//         if (!['APPROVED', 'REJECTED'].includes(status)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid status. Must be either APPROVED or REJECTED"
//             });
//         }

// const result = await prisma.$transaction(async (prisma) => {
//     // Update document status
//     const document = await prisma.document.update({
//         where: { id: parseInt(documentId) },
//         data: {
//             status,
//             adminComment
//         }
//     });

//     // If approved, update user's driver eligibility
//     if (status === 'APPROVED') {
//         await prisma.user.update({
//             where: { id: document.userId },
//             data: { isDriverEligible: true }
//         });
//     }

//     return document;
// });

// res.status(200).json({
//     success: true,
//     data: result
// });
// } catch (error) {
// res.status(400).json({
//     success: false,
//     message: error.message
// });
// }
// };

// const getPendingDocuments = async (req, res) => {
//     try {
//         const documents = await prisma.document.findMany({
//             where: { status: 'PENDING' },
//             include: {
//                 user: {
//                     select: {
//                         id: true,
//                         email: true,
//                         fullName: true
//                     }
//                 }
//             }
//         });

//         res.status(200).json({
//             success: true,
//             data: documents
//         });
//     } catch (error) {
//         res.status(400).json({
//             success: false,
//             message: error.message
//         });
//     }
// };