This contains the first genuinely working video conf version for me.
Not 2-way conferencing. One publisher (in `/front` ) and one receiver (in `/rec`).
Publisher sends data to server (in `/back`) and then the receiver fetches the data from the server.

In this version, receiver only gets the most recent frames since when he/she joined. 
Receiver can jump back to any timestamp greater than the time they joined. (I have not done anything for it, its done by chrome by default since MSE_SourceBuffer is holding the old data).