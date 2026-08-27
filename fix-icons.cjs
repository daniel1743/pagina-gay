const fs = require('fs');

function fixFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Fix imports from @hugeicons/react to @hugeicons/core-free-icons
    content = content.replace(/from\s+'@hugeicons\/react'/g, "from '@hugeicons/core-free-icons'");
    
    // Add import { HugeiconsIcon } from '@hugeicons/react'; if it doesn't exist
    if (!content.includes("import { HugeiconsIcon }")) {
        content = "import { HugeiconsIcon } from '@hugeicons/react';\n" + content;
    }

    // Replace <IconName .../> or <IconName ...></IconName> with <HugeiconsIcon icon={IconName} .../>
    // Be careful with self-closing vs not.
    // Also, don't replace <HugeiconsIcon ... 
    content = content.replace(/<([A-Z]\w*Icon)(\s+[^>]*?)?\/>/g, '<HugeiconsIcon icon={}/>');
    content = content.replace(/<([A-Z]\w*Icon)(\s+[^>]*?)?>([\s\S]*?)<\/\1>/g, '<HugeiconsIcon icon={}></HugeiconsIcon>');

    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed ' + file);
}

fixFile('src/components/opin/OpinCard.jsx');
fixFile('src/pages/OpinFeedPage.jsx');
