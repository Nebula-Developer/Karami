
# Planning

The general goal is to make Karami extensible for a variety of project requirements.
This will primarily be done through a lack of actual useful functionality, and instead a set of types to allow extending the base Karami classes.

- Client connects
  - Check namespace authentication handlers
    - Return unauthorized if any handlers fail
  - Loop through handlers
    - Check private authentication handlers
      - Return unauthorized if any handlers fail
      - Construct handler for client and link to client
  
