
function simulate(data,svg)
{

    const main_group = svg.append("g")
   //calculate degree of the nodes:
    let node_degree={}; 
   d3.map(data.links, (d)=>{
       if(node_degree.hasOwnProperty(d.source))
       {
           node_degree[d.source]++
       }
       else{
           node_degree[d.source]=0
       }
       if(node_degree.hasOwnProperty(d.target))
       {
           node_degree[d.target]++
       }
       else{
           node_degree[d.target]=0
       }
   })

    let scale_radius = d3.scaleLinear()
        .domain(d3.extent(Object.values(node_degree)))
        .range([5,15]);

    const width = parseInt(svg.attr("viewBox").split(' ')[2])
    const height = parseInt(svg.attr("viewBox").split(' ')[3])


    const TopCountries = {};
    data.nodes.forEach(d => {
        TopCountries[d.country] = (TopCountries[d.country] || 0) + 1;
    });
    const sortedCountry = Object.keys(TopCountries).sort((a, b) => b.value - a.value);
    const top10Countries = sortedCountry.slice(0, 10);
    const hueScale = d3.scaleOrdinal(d3.schemeCategory10)
                .domain(top10Countries);

    const tooltip = d3.select("#tooltip");

    const link_elements = main_group.append("g")
        .attr('transform',`translate(${width/2},${height/2})`)
        .selectAll(".line")
        .data(data.links)
        .enter()
        .append("line")
        .attr("stroke", "black")
        .style("stroke-width", "1");
    
    const node_elements = main_group.append("g")
        .attr('transform', `translate(${width / 2},${height / 2})`)
        .selectAll(".circle")
        .data(data.nodes)
        .enter()
        .append("g")
        .on("click", function(event, d) {
            tooltip.transition()
                .style("opacity", .9)
            tooltip.html(`<strong>Author:</strong> ${d.name}
                <div></div>
                <strong>Affiliation:</strong> ${d.affiliation}`)
                .style("left", (event.clientX + 10) + "px")
                .style("top", (event.clientY + 10) + "px");
        })
        .on("mouseenter", function(event, d) {
            const hoveredAffiliation = d.affiliation;
            // Highlight nodes and links with the same affiliation
            node_elements.style("opacity", o => {
                return o.affiliation === hoveredAffiliation ? 1 : 0.2;
            })
            link_elements.style("opacity", o => { 
                return (o.source.affiliation === hoveredAffiliation && o.target.affiliation === hoveredAffiliation) ? 1 : 0.2;
            });
        })
        .on("mouseout", function() {
            // Reset opacity of nodes and links
            node_elements.style("opacity", 1);
            link_elements.style("opacity", 1);
            tooltip.transition()
                        .style("opacity", 0)
        })

    node_elements.append("circle")
        .attr("r",  d=>{
            if(node_degree[d.id] !== undefined){
                return scale_radius(node_degree[d.id])
            }
            else{
                return scale_radius(0)
            } 
        })
        .attr("fill",  d => top10Countries.includes(d.country) ? hueScale(d.country) : "#A9A9A9")


    const ForceSimulation = d3.forceSimulation(data.nodes)
        .force("collide",
            d3.forceCollide().radius( (d,i)=> scale_radius(node_degree[i])*4))
        .force("x", d3.forceX())
        .force("y", d3.forceY())
        .force("charge", d3.forceManyBody())
        .force("link",d3.forceLink(data.links)
            .id( d=> d.id)
            .distance(50)
            .strength(0.5)
        )
        .on("tick", ticked);

    function ticked()
    {
        node_elements.attr("transform", d => `translate(${d.x}, ${d.y})`);

        link_elements
            .attr("x1",d=>d.source.x)
            .attr("x2",d=>d.target.x)
            .attr("y1",d=>d.source.y)
            .attr("y2",d=>d.target.y)

        }
        document.addEventListener("input",e=>{
            const tagId = e.target.id;
            const value = e.target.value
            switch (tagId){
                case "forceManyBody":
                    ForceSimulation.force("charge").strength(value)
                    break
                case "forceLink":
                   ForceSimulation.force("link").strength(parseFloat(value))
                    break
                case "forceCollide":
                    ForceSimulation.force("collide").radius(value)
                    break
            }
           ForceSimulation.alpha(1).restart()
    
        })
    
        svg.call(d3.zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([1, 8])
        .on("zoom", zoomed));
        function zoomed({transform}) {
            main_group.attr("transform", transform);
        }
}