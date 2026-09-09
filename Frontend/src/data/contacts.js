// Mock contacts data for family group chat
export const familyContacts = [
  {
    id: 1,
    name: 'Priya Sharma',
    relation: 'Bride',
    phone: '+91 98765 43210',
    email: 'priya.sharma@email.com',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    isOnline: true,
    role: 'admin'
  },
  {
    id: 2,
    name: 'Rahul Gupta',
    relation: 'Groom',
    phone: '+91 98765 43211',
    email: 'rahul.gupta@email.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    isOnline: true,
    role: 'admin'
  },
  {
    id: 3,
    name: 'Sunita Sharma',
    relation: 'Mother (Bride)',
    phone: '+91 98765 43212',
    email: 'sunita.sharma@email.com',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    isOnline: false,
    role: 'member'
  },
  {
    id: 4,
    name: 'Rajesh Sharma',
    relation: 'Father (Bride)',
    phone: '+91 98765 43213',
    email: 'rajesh.sharma@email.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    isOnline: true,
    role: 'member'
  },
  {
    id: 5,
    name: 'Meera Gupta',
    relation: 'Mother (Groom)',
    phone: '+91 98765 43214',
    email: 'meera.gupta@email.com',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    isOnline: true,
    role: 'member'
  },
  {
    id: 6,
    name: 'Vikram Gupta',
    relation: 'Father (Groom)',
    phone: '+91 98765 43215',
    email: 'vikram.gupta@email.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    isOnline: false,
    role: 'member'
  },
  {
    id: 7,
    name: 'Anjali Sharma',
    relation: 'Sister (Bride)',
    phone: '+91 98765 43216',
    email: 'anjali.sharma@email.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    isOnline: true,
    role: 'member'
  },
  {
    id: 8,
    name: 'Arjun Gupta',
    relation: 'Brother (Groom)',
    phone: '+91 98765 43217',
    email: 'arjun.gupta@email.com',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
    isOnline: true,
    role: 'member'
  },
  {
    id: 9,
    name: 'Kavya Sharma',
    relation: 'Cousin (Bride)',
    phone: '+91 98765 43218',
    email: 'kavya.sharma@email.com',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
    isOnline: false,
    role: 'member'
  },
  {
    id: 10,
    name: 'Rohit Gupta',
    relation: 'Cousin (Groom)',
    phone: '+91 98765 43219',
    email: 'rohit.gupta@email.com',
    avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face',
    isOnline: true,
    role: 'member'
  },
  {
    id: 11,
    name: 'Nisha Agarwal',
    relation: 'Best Friend (Bride)',
    phone: '+91 98765 43220',
    email: 'nisha.agarwal@email.com',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop&crop=face',
    isOnline: true,
    role: 'member'
  },
  {
    id: 12,
    name: 'Karan Singh',
    relation: 'Best Friend (Groom)',
    phone: '+91 98765 43221',
    email: 'karan.singh@email.com',
    avatar: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face',
    isOnline: false,
    role: 'member'
  }
];

// Mock groups data
export const familyGroups = [
  {
    id: 1,
    name: 'Wedding Planning Committee',
    description: 'Main planning group for all wedding arrangements',
    avatar: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=150&h=150&fit=crop',
    members: [1, 2, 3, 4, 5, 6],
    createdBy: 1, // Priya is admin
    createdAt: '2024-01-15T10:00:00Z',
    lastMessage: {
      text: 'Venue booking confirmed for Dec 15th!',
      sender: 'Priya Sharma',
      time: '2:30 PM'
    },
    unreadCount: 3,
    isActive: true
  },
  {
    id: 2,
    name: 'Decoration Team',
    description: 'Planning decorations and themes',
    avatar: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=150&h=150&fit=crop',
    members: [1, 3, 7, 9],
    createdBy: 1, // Priya is admin
    createdAt: '2024-01-20T14:30:00Z',
    lastMessage: {
      text: 'Love the floral arrangements!',
      sender: 'Anjali Sharma',
      time: '1:15 PM'
    },
    unreadCount: 0,
    isActive: true
  }
];

// Mock chat messages
export const groupMessages = {
  1: [
    {
      id: 1,
      senderId: 1,
      senderName: 'Priya Sharma',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face',
      message: 'Hi everyone! Let\'s start planning our dream wedding! 💕',
      timestamp: '2024-01-15T10:00:00Z',
      type: 'text'
    },
    {
      id: 2,
      senderId: 2,
      senderName: 'Rahul Gupta',
      senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
      message: 'Absolutely! I\'m so excited. Where should we start?',
      timestamp: '2024-01-15T10:05:00Z',
      type: 'text'
    },
    {
      id: 3,
      senderId: 3,
      senderName: 'Sunita Sharma',
      senderAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face',
      message: 'First, we need to finalize the venue. I have a few options in mind.',
      timestamp: '2024-01-15T10:10:00Z',
      type: 'text'
    },
    {
      id: 4,
      senderId: 4,
      senderName: 'Rajesh Sharma',
      senderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
      message: 'Great! Let\'s also discuss the budget allocation.',
      timestamp: '2024-01-15T10:15:00Z',
      type: 'text'
    },
    {
      id: 5,
      senderId: 1,
      senderName: 'Priya Sharma',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face',
      message: 'Perfect! Venue booking confirmed for Dec 15th! 🎉',
      timestamp: '2024-01-15T14:30:00Z',
      type: 'text'
    }
  ],
  2: [
    {
      id: 1,
      senderId: 1,
      senderName: 'Priya Sharma',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face',
      message: 'Let\'s discuss the decoration theme. I\'m thinking royal pink and gold! ✨',
      timestamp: '2024-01-20T14:30:00Z',
      type: 'text'
    },
    {
      id: 2,
      senderId: 7,
      senderName: 'Anjali Sharma',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop&crop=face',
      message: 'Love the floral arrangements! The roses look amazing 🌹',
      timestamp: '2024-01-20T15:15:00Z',
      type: 'text'
    }
  ]
};