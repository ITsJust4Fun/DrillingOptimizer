var ghpages = require('gh-pages');

ghpages.publish(
    'public', // path to public directory
    {
        branch: 'gh-pages',
        repo: 'https://github.com/ITsJust4Fun/DrillingOptimizer.git', // Update to point to your repository  
        user: {
            name: 'ITsJust4Fun', // update to use your name
            email: 'artyomrodimov@yandex.ru' // Update to use your email
        }
    },
    () => {
        console.log('Deploy Complete!')
    }
)