function RegisterMenuItems(){
    return [
        {
            header: '',
            showHeader: false,
            showSeparator: false,
            items: [
        	    {action: '', icon: 'home', color: 'blue', text: 'Home'}
	        ],
	        allowedRoles: ['user', 'admin', 'superadmin', 'editor', 'creator', 'viewer']
        },
        {
            header: '',
            showHeader: false,
            showSeparator: false,
            items: [
        	    {action: 'forms-procedures', icon: 'event_note', color: 'brown', text: 'Procedures'},
        	    {action: 'forms', icon: 'assignment_turned_in', color: 'purple', text: 'Forms'},
        	    {action: 'forms-master', icon: 'content_copy', color: 'green', text: 'Masters'},
                {action: 'reporthome', icon: 'pie_chart', color: 'cyan', text: 'Reports'},
        	    {action: 'forms-search', icon: 'search', color: 'red', text: 'Search'}
	        ],
	        allowedRoles: ['user', 'admin', 'editor', 'creator', 'viewer']
        },
        {
            header: 'Administration',
            showHeader: true,
            showSeparator: true,
            items: [
            	{action: 'forms-category', icon: 'list', color: 'brown', text: 'Categories'},
        	    {action: 'forms-question-bank', icon: 'question_answer', color: 'orange', text: 'Question Bank'},
        	    /*{action: 'users', icon: 'person', color: 'blue', text: 'Users'},*/
        	    {action: 'forms-users', icon: 'people', color: 'red', text: 'Users'},
                {action: 'forms-usergroups', icon: 'group_add', color: 'purple', text: 'User Group'}
	        ],
	        allowedRoles: ['admin']
        },
        {
            header: 'Customer Management',
            showHeader: false,
            showSeparator: false,
            items: [
        	    {action: 'organizations', icon: 'people_outline', color: '', text: 'Organizations'}
	        ],
	        allowedRoles: ['superadmin']
        }
    ];
}