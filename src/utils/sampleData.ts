export function createSampleFiles(): File[] {
  const sample1Content = `SNo,Participant Name,Attendance Started at,Joined at(beta),Attendance Stopped at,Attended Duration,Meeting code
1,Alex Johnson,09:00:00 AM,09:01:00 AM,10:00:00 AM,60m,abc-defg-hij
2,Maria Garcia,09:05:00 AM,09:05:30 AM,10:00:00 AM,55m,abc-defg-hij
3,Liam Smith,09:00:00 AM,09:02:00 AM,10:00:00 AM,60m,abc-defg-hij
4,Sarah Connor,09:15:00 AM,09:16:00 AM,09:45:00 AM,30m,abc-defg-hij
5,Maria Garcia,09:05:00 AM,09:05:30 AM,10:00:00 AM,55m,abc-defg-hij`;

  const sample2Content = `SNo,Participant Name,Attendance Started at,Joined at(beta),Attendance Stopped at,Attended Duration,Meeting code
6,Emma Watson,09:00:00 AM,09:00:45 AM,10:00:00 AM,60m,abc-defg-hij
7,Liam Smith,09:00:00 AM,09:02:00 AM,10:00:00 AM,60m,abc-defg-hij
8,David Miller,09:10:00 AM,09:12:00 AM,10:00:00 AM,50m,abc-defg-hij
9,Alex Johnson,09:00:00 AM,09:01:00 AM,10:00:00 AM,60m,abc-defg-hij`;

  const file1 = new File([sample1Content], "Attendance (12-May-2024).csv", { type: "text/csv" });
  const file2 = new File([sample2Content], "Attendance (14-May-2024).csv", { type: "text/csv" });

  return [file1, file2];
}
