const {PrismaClient} = require('@prisma/client');
const prisma  = new PrismaClient();

const createJournalEntry  = async (req , res) => {
    const { reason , mitigationPlan , taskId }  = req.body ; 
    const userId = req.user.id ; 
    if (!reason || !mitigationPlan)
    {
        return res.status(400).json({message: " Journal entery can't be empty "});

    }

try{
    const newEntry  = await prisma.journalEnrty.create({
        data: { userId , //when key and value are same we can write it once
            taskId: taskId ? parseInt(taskId) : null,
            reason , //when both key and value are same we can write it once
            mitigation : mitigationPlan

        },
    });
    res.status(201).json(newEntry); 

}
catch(error){
    console.error("Error creating journal entry:" , error );
    res.status(500).json({message: "Server error while saving the journal entry ."});
}
};
module.exports = {createJournalEntry};  

