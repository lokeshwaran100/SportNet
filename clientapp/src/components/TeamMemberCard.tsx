import React from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons';

interface TeamMemberCardProps {
  image: string;
  name: string;
  role: string;
  description: string;
  github?: string;
  twitter?: string;
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ image, name, role, description, github, twitter }) => {
  return (
    <div className="max-w-sm rounded overflow-hidden shadow-lg my-4 bg-purple-700 mx-auto">
      <div className="w-32 h-32 mx-auto mt-4 rounded-full overflow-hidden">
        <Image src={image} alt={name} width={128} height={128} className="object-cover" />
      </div>
      <div className="px-6 py-4 text-center">
        <div className="font-bold text-xl mb-2 text-white">{name}</div>
        <p className="text-gray-400 text-base">{role}</p>
        <p className="text-white text-base mt-2">{description}</p>
      </div>
      <div className="px-6 py-4 flex justify-center space-x-4">
        {github && (
          <a href={github} target="_blank" rel="noopener noreferrer">
            <FontAwesomeIcon icon={faGithub} size="lg" className="text-white hover:text-gray-400" />
          </a>
        )}
        {twitter && (
          <a href={twitter} target="_blank" rel="noopener noreferrer">
            <FontAwesomeIcon icon={faTwitter} size="lg" className="text-white hover:text-gray-400" />
          </a>
        )}
      </div>
    </div>
  );
};

export default TeamMemberCard;
