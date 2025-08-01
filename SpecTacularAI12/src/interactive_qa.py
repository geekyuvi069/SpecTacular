def run_query_answering():
    """
    Interactive CLI loop to query the document.
    """
    print("\n=== SmartSpec AI Interactive Query Mode ===")
    print("Type your query below (or 'exit' to quit):\n")

    while True:
        query = input(">> ").strip()
        if query.lower() in ["exit", "quit"]:
            print("Exiting interactive query mode.")
            break

        if not query:
            print("Please enter a query or type 'exit'.")
            continue

        # Generate response based on query
        response = generate_answer(query)

        print(f"\nAI Generated Test Cases:\n{response}\n")

def generate_answer(query_text):
    """
    Simulate answer generation.
    In production, you would:
    - Encode the query
    - Attend over encoder outputs
    - Decode step by step
    """
    # Enhanced response based on query type
    query_lower = query_text.lower()
    
    if "login" in query_lower or "authentication" in query_lower:
        return (
            "1. Validate user credentials with correct username/password.\n"
            "2. Test with incorrect username/password combinations.\n"
            "3. Verify password complexity enforcement.\n"
            "4. Confirm account lockout after 3 failed attempts.\n"
            "5. Test password reset functionality.\n"
            "6. Verify session timeout behavior."
        )
    elif "validation" in query_lower or "validate" in query_lower:
        return (
            "1. Test input field validation with valid data.\n"
            "2. Test with invalid data formats.\n"
            "3. Verify required field validation.\n"
            "4. Test boundary value conditions.\n"
            "5. Verify error message display and clarity."
        )
    elif "dashboard" in query_lower or "display" in query_lower:
        return (
            "1. Verify dashboard loads with correct user data.\n"
            "2. Test dashboard refresh functionality.\n"
            "3. Confirm auto-refresh occurs every 5 minutes.\n"
            "4. Test responsive design on different screen sizes.\n"
            "5. Verify data accuracy and real-time updates."
        )
    else:
        return (
            "1. Execute the main functionality described in requirements.\n"
            "2. Test with valid input data.\n"
            "3. Test with invalid/edge case data.\n"
            "4. Verify error handling and user feedback.\n"
            "5. Confirm system behavior matches specifications."
        )
