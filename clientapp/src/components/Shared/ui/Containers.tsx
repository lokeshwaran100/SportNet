import React, { ReactNode } from 'react'

type ContainerProps = {
  children: ReactNode
  className?: string
}

export const SectionContainer: React.FC<ContainerProps> = ({ children, className }) => {
  return <section className={`relative ${className}`}>{children}</section>
}

export const Container: React.FC<ContainerProps> = ({ children, className }) => {
  return (
    <div
      className={`flex h-full flex-col justify-end items-start px-2 py-2 w-full max-w-10xl mx-auto ${className}`}
    >
      {children}
    </div>
  )
}

export const NavContainer: React.FC<ContainerProps> = ({ children, className }) => {
  return (
    <header className="relative">
      <nav
        className={`max-w-10xl mx-auto flex justify-between items-center px-3 lg:px:8 py-4 ${className}`}
      >
        {children}
      </nav>
    </header>
  )
}
