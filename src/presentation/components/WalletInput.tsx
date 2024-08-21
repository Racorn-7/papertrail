import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ethers } from 'ethers';

// TypeScript types for nodes and links
interface Node extends d3.SimulationNodeDatum {
  id: string;
}

interface Link {
  source: string | Node;
  target: string | Node;
  value: number;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

const WalletGraph: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const fetchTransactions = async (address: string): Promise<ethers.providers.TransactionResponse[]> => {
    const provider = new ethers.providers.EtherscanProvider('homestead', process.env.REACT_APP_API_KEY_ETHERSCAN);
    const transactions = await provider.getHistory(address, 0, 'latest');
    return transactions.slice(-1000); // Get the most recent 1000 transactions
  };

  const truncate = (str: string, n: number): string => {
    return (str.length > n) ? str.slice(0, n-1) + '...' : str;
  };

  const transformTransactionsToGraph = (transactions: ethers.providers.TransactionResponse[]): GraphData => {
    const nodes = new Set<string>();
    const links: Link[] = [];

    transactions.forEach(tx => {
      const sender = tx.from.toLowerCase();
      const recipient = tx.to ? tx.to.toLowerCase() : null;

      nodes.add(sender);
      if (recipient) nodes.add(recipient);

      if (recipient) {
        links.push({
          source: sender,
          target: recipient,
          value: parseFloat(ethers.utils.formatEther(tx.value))
        });
      }
    });

    return {
      nodes: Array.from(nodes).map(id => ({ id })),
      links
    };
  }; 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const transactions = await fetchTransactions(walletAddress);
    const graph = transformTransactionsToGraph(transactions);
    setGraphData(graph);
  };

  useEffect(() => {
    if (graphData) {
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove(); // Clear previous graph

      const width = window.innerWidth;
      const height = window.innerHeight;

      const simulation = d3.forceSimulation<Node>(graphData.nodes)
        .force("link", d3.forceLink<Node, Link>(graphData.links).id(d => d.id).distance(200))
        .force("charge", d3.forceManyBody().strength(-500))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("radial", d3.forceRadial(300, width / 2, height / 2)) // Radial layout
        .force("collide", d3.forceCollide(50)); // Collision detection
        

      const link = svg.append("g")
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(graphData.links)
      .enter().append('line')
      .attr('stroke-width', (d) => Math.sqrt(d.value));

      link.attr("d", function(d) {
        const dx = (d.target as Node).x! - (d.source as Node).x!,
              dy = (d.target as Node).y! - (d.source as Node).y!,
              dr = Math.sqrt(dx * dx + dy * dy);
        return `M${(d.source as Node).x!},${(d.source as Node).y!}A${dr},${dr} 0 0,1 ${(d.target as Node).x!},${(d.target as Node).y!}`;});

      link.on('mouseover', function (d) {
        console.log('Transaction Value:', Number(d.value)); // Log the transaction value on hover
        d3.select(this).attr('stroke', 'orange').attr('stroke-width', 3);
      })
      .on('mouseout', function () {
        d3.select(this).attr('stroke', 'black').attr('stroke-width', 1);
      });

      const node = svg.append("g")
        .attr("class", "nodes")
        .selectAll<SVGGElement, Node>("g")
        .data(graphData.nodes)
        .enter().append("g");

      node.append("circle")
        .attr("r", 20)
        .attr("fill", "steelblue");

      node.append("text")
        .text(d => truncate(d.id, 7))
        .attr('x', 6)
        .attr('y', 3);

      node.call(
        d3.drag<SVGGElement, Node>()
          .on("start", (event, d) => dragstarted(event, d, simulation))
          .on("drag", (event, d) => dragged(event, d))
          .on("end", (event, d) => dragended(event, d, simulation))
      );

      simulation
        .nodes(graphData.nodes)
        .on("tick", () => ticked(link, node));

      simulation.force<d3.ForceLink<Node, Link>>("link").links(graphData.links);
    }
  }, [graphData]);

  const ticked = (
    link: d3.Selection<SVGLineElement, Link, SVGGElement, Link>,
    node: d3.Selection<SVGGElement, Node, SVGGElement, Node>
  ) => {
    link
    .attr("x1", (d) => (d.source instanceof Object && 'x' in d.source) ? (d.source as Node).x ?? 0 : 0)
    .attr("y1", (d) => (d.source instanceof Object && 'y' in d.source) ? (d.source as Node).y ?? 0 : 0)
    .attr("x2", (d) => (d.target instanceof Object && 'x' in d.target) ? (d.target as Node).x ?? 0 : 0)
    .attr("y2", (d) => (d.target instanceof Object && 'y' in d.target) ? (d.target as Node).y ?? 0 : 0);
  
    node.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
  };
  

  const dragstarted = (event: d3.D3DragEvent<SVGGElement, Node, Node>, d: Node, simulation: d3.Simulation<Node, undefined>) => {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = event.x;
    d.fy = event.y;
  };

  const dragged = (event: d3.D3DragEvent<SVGGElement, Node, Node>, d: Node) => {
    d.fx = event.x;
    d.fy = event.y;
  };

  const dragended = (event: d3.D3DragEvent<SVGGElement, Node, Node>, d: Node, simulation: d3.Simulation<Node, undefined>) => {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder="Enter Wallet Address"
        />
        <button type="submit">Generate Graph</button>
      </form>
      <svg ref={svgRef} width={window.innerWidth} height={window.innerHeight}></svg>
    </div>
  );
};

export default WalletGraph;
