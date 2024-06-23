import React from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons';

const TeamMemberCard = ({ image, name, role, description, github, twitter }) => {
  return (
    <div className="max-w-sm rounded overflow-hidden shadow-lg my-4 bg-dark-purple">
      <Image className="w-full" src={image} alt={name} width={400} height={300} />
      <div className="px-6 py-4">
        <div className="font-bold text-xl mb-2 text-white">{name}</div>
        <p className="text-gray-400 text-base">{role}</p>
        <p className="text-white text-base">{description}</p>
      </div>
      <div className="px-6 py-4 flex space-x-4">
        {github && (
          <a href={github} target="_blank" rel="noopener noreferrer">
            <FontAwesomeIcon icon={faGithub} size="2x" className="text-white hover:text-gray-400" />
          </a>
        )}
        {twitter && (
          <a href={twitter} target="_blank" rel="noopener noreferrer">
            <FontAwesomeIcon icon={faTwitter} size="2x" className="text-white hover:text-gray-400" />
          </a>
        )}
      </div>
    </div>
  );
};

export default TeamMemberCard;
