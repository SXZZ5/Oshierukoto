def merge_binary_files(file1_path, file2_path, output_file_path):
    try:
        # Open the output file in write-binary mode
        with open(output_file_path, 'wb') as output_file:
            # Open and read the first file, then write its content to the output file
            with open(file1_path, 'rb') as file1:
                output_file.write(file1.read())
            # Open and read the second file, then append its content to the output file
            with open(file2_path, 'rb') as file2:
                output_file.write(file2.read())
        print(f"Files {file1_path} and {file2_path} have been merged into {output_file_path}.")
    except FileNotFoundError as e:
        print(f"Error: {e}")
    except IOError as e:
        print(f"An I/O error occurred: {e}")

# Example usage
file1 = "data1.mp4"  # Path to the first binary file
file2 = "data3.mp4"  # Path to the second binary file
output_file = "merged_file3.mp4"  # Path to the output binary file
merge_binary_files(file1, file2, output_file)
