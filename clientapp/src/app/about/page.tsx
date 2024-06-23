import React from 'react';
import TeamMemberCard from '@/components/TeamMemberCard';

const teamMembers = [
  {
    image: '/images/1.png',
    name: 'Lokesh',
    role: 'Backend Developer & Smart Contracts',
    description: 'Expert in blockchain technology and backend systems.',
    github: 'https://github.com/lokeshwaran100',
    twitter: 'https://twitter.com/cryptowithloki'
  },
  {
    image: '/images/2.png',
    name: 'Kalpita',
    role: 'Backend Developer & Smart Contracts',
    description: 'Skilled in smart contract development and backend architecture.',
    github: 'https://github.com/KalpitaMandal',
    twitter: 'https://twitter.com/KalpitaMandal'
  },
  {
    image: '/images/3.png',
    name: 'Aditya',
    role: 'Frontend Developer',
    description: 'Focused on creating intuitive and beautiful user interfaces.',
    github: 'https://github.com/Adithya2310',
    twitter: 'https://twitter.com/_Adithya_n_g'
  },
  {
    image: '/images/4.png',
    name: 'Pratik',
    role: 'Frontend Developer, Socials & Products',
    description: 'Frontend newbie, socials and products',
    github: 'https://github.com/pratiksardar',
    twitter: 'https://twitter.com/pratik_sardar'
  }
];

const About = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Meet Our Team</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
        {teamMembers.map((member, index) => (
          <TeamMemberCard 
            key={index}
            image={member.image}
            name={member.name}
            role={member.role}
            description={member.description}
            github={member.github}
            twitter={member.twitter}
          />
        ))}
      </div>
    </div>
  );
};

export default About;
