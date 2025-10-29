import React from 'react';
import styled, { keyframes } from 'styled-components';

const shimmer = keyframes`
  0% {
    background-position: -468px 0;
  }
  100% {
    background-position: 468px 0;
  }
`;

const SkeletonBase = styled.div`
  background-color: var(--background);
  background-image: linear-gradient(to right, var(--background) 0%, var(--surface-variant) 20%, var(--background) 40%, var(--background) 100%);
  background-repeat: no-repeat;
  background-size: 800px 104px;
  animation: ${shimmer} 1.5s linear infinite;
  border-radius: 4px;
  width: 100%;
  height: 100%;
`;

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string;
  height?: string;
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ width = '100%', height = '20px', className, style, ...rest }) => (
  <SkeletonBase 
    className={className} 
    style={{ ...style, width, height }} 
    {...rest} 
  />
);

export default Skeleton;
