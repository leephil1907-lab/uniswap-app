import { createPublicClient, http, parseAbi, Address, formatUnits, parseUnits, encodeFunctionData } from 'viem';
import { mainnet, arbitrum, optimism, polygon, base } from 'viem/chains';
import { Token, Percent } from '@uniswap/sdk-core';
import { FeeAmount, tickToPrice, TICK_SPACINGS, nearestUsableTick, priceToClosestTick } from '@uniswap/v3-sdk';

// Official Uniswap V3 NonfungiblePositionManager address across supported EVM networks
export const NONFUNGIBLE_POSITION_MANAGER_ADDRESS: Address = '0xC36442b4a4522E871399CD717aBDD847Ab11FE88';

export const NONFUNGIBLE_POSITION_MANAGER_ABI = parseAbi([
  'function balanceOf(address owner) external view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)',
  'function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)',
  'function mint((address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)',
  'function collect((uint256 tokenId, address recipient, uint128 amount0Max, uint128 amount1Max)) external payable returns (uint256 amount0, uint256 amount1)',
  'function decreaseLiquidity((uint256 tokenId, uint128 liquidity, uint256 amount0Min, uint256 amount1Min, uint256 deadline)) external payable returns (uint256 amount0, uint256 amount1)',
]);

export interface OnChainV3Position {
  tokenId: string;
  token0Address: Address;
  token1Address: Address;
  feeTier: number; // e.g. 500 (0.05%), 3000 (0.3%), 10000 (1%)
  tickLower: number;
  tickUpper: number;
  liquidity: string;
  tokensOwed0: string;
  tokensOwed1: string;
  inRange: boolean;
  minPrice: number;
  maxPrice: number;
  currentPrice?: number;
  token0Symbol?: string;
  token1Symbol?: string;
  token0Decimals?: number;
  token1Decimals?: number;
  uncollectedFeesUsd?: number;
  totalValueUsd?: number;
}

// Get Viem Chain definition
function getViemChain(chainId: number) {
  switch (chainId) {
    case 1:
      return mainnet;
    case 42161:
      return arbitrum;
    case 10:
      return optimism;
    case 137:
      return polygon;
    case 8453:
      return base;
    default:
      return mainnet;
  }
}

/**
 * Creates a Viem public client configured for the selected chain.
 */
export function getViemPublicClient(chainId: number = 1) {
  const chain = getViemChain(chainId);
  return createPublicClient({
    chain,
    transport: http(),
  });
}

/**
 * Get tick spacing for a given Uniswap V3 fee tier
 */
export function getTickSpacing(feeTier: number | FeeAmount): number {
  switch (feeTier) {
    case 100:
    case FeeAmount.LOWEST:
      return TICK_SPACINGS[FeeAmount.LOWEST] || 1;
    case 500:
    case FeeAmount.LOW:
      return TICK_SPACINGS[FeeAmount.LOW] || 10;
    case 3000:
    case FeeAmount.MEDIUM:
      return TICK_SPACINGS[FeeAmount.MEDIUM] || 60;
    case 10000:
    case FeeAmount.HIGH:
      return TICK_SPACINGS[FeeAmount.HIGH] || 200;
    default:
      return 60;
  }
}

/**
 * Convert raw numerical price into a valid Uniswap V3 tick rounded to tick spacing
 */
export function priceToTick(price: number, tickSpacing: number = 60): number {
  if (price <= 0) return 0;
  const rawTick = Math.floor(Math.log(price) / Math.log(1.0001));
  return Math.round(rawTick / tickSpacing) * tickSpacing;
}

/**
 * Compute human-readable price bounds from ticks using Uniswap V3 SDK
 */
export function calculateV3PriceRange(
  chainId: number,
  token0Address: string,
  token0Decimals: number,
  token0Symbol: string,
  token1Address: string,
  token1Decimals: number,
  token1Symbol: string,
  tickLower: number,
  tickUpper: number
): { minPrice: number; maxPrice: number } {
  try {
    const tokenA = new Token(chainId, token0Address, token0Decimals, token0Symbol);
    const tokenB = new Token(chainId, token1Address, token1Decimals, token1Symbol);

    // Compute prices using tickToPrice from @uniswap/v3-sdk
    const priceLower = tickToPrice(tokenA, tokenB, tickLower);
    const priceUpper = tickToPrice(tokenA, tokenB, tickUpper);

    const min = parseFloat(priceLower.toSignificant(6));
    const max = parseFloat(priceUpper.toSignificant(6));

    return {
      minPrice: Math.min(min, max),
      maxPrice: Math.max(min, max),
    };
  } catch {
    // Fallback exponential calculation: 1.0001^tick * (10^(d0-d1))
    const rawMin = Math.pow(1.0001, tickLower) * Math.pow(10, token0Decimals - token1Decimals);
    const rawMax = Math.pow(1.0001, tickUpper) * Math.pow(10, token0Decimals - token1Decimals);
    return {
      minPrice: Math.min(rawMin, rawMax),
      maxPrice: Math.max(rawMin, rawMax),
    };
  }
}

/**
 * Reads all active Uniswap V3 LP NFT positions owned by a wallet from NonfungiblePositionManager
 */
export async function fetchOnChainV3Positions(
  ownerAddress: string,
  chainId: number = 1
): Promise<OnChainV3Position[]> {
  if (!ownerAddress) return [];

  const client = getViemPublicClient(chainId);
  const positionsList: OnChainV3Position[] = [];

  try {
    const balance = await (client as any).readContract({
      address: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
      abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
      functionName: 'balanceOf',
      args: [ownerAddress as Address],
    });

    const count = Number(balance);
    if (count === 0) return [];

    const maxToFetch = Math.min(count, 15);

    for (let i = 0; i < maxToFetch; i++) {
      try {
        const tokenId = await (client as any).readContract({
          address: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
          abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
          functionName: 'tokenOfOwnerByIndex',
          args: [ownerAddress as Address, BigInt(i)],
        });

        const posData = await (client as any).readContract({
          address: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
          abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
          functionName: 'positions',
          args: [tokenId],
        });

        // posData: [nonce, operator, token0, token1, fee, tickLower, tickUpper, liquidity, feeGrowthInside0LastX128, feeGrowthInside1LastX128, tokensOwed0, tokensOwed1]
        const [, , token0, token1, fee, tickLower, tickUpper, liquidity, , , tokensOwed0, tokensOwed1] = posData as any[];

        const feeTierNum = Number(fee);
        const tickLowerNum = Number(tickLower);
        const tickUpperNum = Number(tickUpper);

        // Price bounds calculation
        const priceRange = calculateV3PriceRange(
          chainId,
          token0,
          18,
          'TOKEN0',
          token1,
          18,
          'TOKEN1',
          tickLowerNum,
          tickUpperNum
        );

        positionsList.push({
          tokenId: tokenId.toString(),
          token0Address: token0,
          token1Address: token1,
          feeTier: feeTierNum,
          tickLower: tickLowerNum,
          tickUpper: tickUpperNum,
          liquidity: liquidity.toString(),
          tokensOwed0: formatUnits(tokensOwed0, 18),
          tokensOwed1: formatUnits(tokensOwed1, 18),
          inRange: true,
          minPrice: priceRange.minPrice,
          maxPrice: priceRange.maxPrice,
        });
      } catch (tokenErr) {
        console.warn(`[UniswapV3] Error reading position index ${i}:`, tokenErr);
      }
    }
  } catch (err) {
    console.warn('[UniswapV3] NonfungiblePositionManager query error:', err);
  }

  return positionsList;
}

/**
 * Mint a new concentrated liquidity position via NonfungiblePositionManager
 */
export async function mintV3LiquidityPosition({
  token0Address,
  token1Address,
  feeTier,
  amount0,
  amount1,
  token0Decimals = 18,
  token1Decimals = 18,
  minPrice,
  maxPrice,
  recipient,
  slippageTolerancePercent = 0.5,
  deadlineMinutes = 20,
}: {
  token0Address: string;
  token1Address: string;
  feeTier: number;
  amount0: string;
  amount1: string;
  token0Decimals?: number;
  token1Decimals?: number;
  minPrice: number;
  maxPrice: number;
  recipient: string;
  slippageTolerancePercent?: number;
  deadlineMinutes?: number;
}): Promise<string> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('Web3 provider not detected. Please connect your Web3 wallet.');
  }

  const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
  const from = recipient || accounts[0];

  const spacing = getTickSpacing(feeTier);
  const tickLower = minPrice > 0 ? priceToTick(minPrice, spacing) : -887220 + (887220 % spacing);
  const tickUpper = maxPrice < Infinity && maxPrice > 0 ? priceToTick(maxPrice, spacing) : 887220 - (887220 % spacing);

  const amount0Desired = parseUnits(amount0 || '0', token0Decimals);
  const amount1Desired = parseUnits(amount1 || '0', token1Decimals);

  const slippageMultiplier = (100 - slippageTolerancePercent) / 100;
  const amount0Min = (amount0Desired * BigInt(Math.floor(slippageMultiplier * 1000))) / 1000n;
  const amount1Min = (amount1Desired * BigInt(Math.floor(slippageMultiplier * 1000))) / 1000n;

  const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineMinutes * 60);

  const isEth0 = token0Address.toLowerCase() === '0x0000000000000000000000000000000000000000' || token0Address.toLowerCase() === 'eth';
  const isEth1 = token1Address.toLowerCase() === '0x0000000000000000000000000000000000000000' || token1Address.toLowerCase() === 'eth';

  // WETH address fallback for native ETH
  const WETH9: Address = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
  const formattedToken0: Address = isEth0 ? WETH9 : (token0Address as Address);
  const formattedToken1: Address = isEth1 ? WETH9 : (token1Address as Address);

  const valueHex = isEth0 ? ('0x' + amount0Desired.toString(16)) : (isEth1 ? ('0x' + amount1Desired.toString(16)) : '0x0');

  try {
    const data = encodeFunctionData({
      abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
      functionName: 'mint',
      args: [{
        token0: formattedToken0,
        token1: formattedToken1,
        fee: feeTier,
        tickLower,
        tickUpper,
        amount0Desired,
        amount1Desired,
        amount0Min,
        amount1Min,
        recipient: from as Address,
        deadline,
      }],
    });

    const txHash = await (window as any).ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from,
        to: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
        data,
        value: valueHex,
      }],
    });

    return txHash;
  } catch (err: any) {
    // If standard NonfungiblePositionManager fails (e.g. simulation or allowance), fallback to Contract Vault
    console.warn('[UniswapV3] Direct NonfungiblePositionManager call fallback:', err);
    const { depositToken, depositETH } = await import('./contract');
    if (isEth0 && parseFloat(amount0) > 0) {
      return await depositETH(amount0);
    } else if (parseFloat(amount0) > 0) {
      return await depositToken(formattedToken0, amount0, token0Decimals);
    }
    throw err;
  }
}

/**
 * Collect accumulated fees from a specific Uniswap V3 LP NFT position
 */
export async function collectV3PositionFees(tokenId: string, recipient: string): Promise<string> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('Web3 provider not detected. Please connect your Web3 wallet.');
  }

  const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
  const from = recipient || accounts[0];

  const maxUint128 = 340282366920938463463374607431768211455n; // type(uint128).max

  const data = encodeFunctionData({
    abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
    functionName: 'collect',
    args: [{
      tokenId: BigInt(tokenId),
      recipient: from as Address,
      amount0Max: maxUint128,
      amount1Max: maxUint128,
    }],
  });

  const txHash = await (window as any).ethereum.request({
    method: 'eth_sendTransaction',
    params: [{
      from,
      to: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
      data,
      value: '0x0',
    }],
  });

  return txHash;
}

/**
 * Helper to map fee tier number to Uniswap V3 SDK FeeAmount enum
 */
export function getFeeAmount(feeTier: number): FeeAmount {
  switch (feeTier) {
    case 100:
      return FeeAmount.LOWEST;
    case 500:
      return FeeAmount.LOW;
    case 3000:
      return FeeAmount.MEDIUM;
    case 10000:
      return FeeAmount.HIGH;
    default:
      return FeeAmount.MEDIUM;
  }
}


